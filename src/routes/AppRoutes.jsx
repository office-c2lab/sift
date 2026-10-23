import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import useCreateDataset from '../hooks/useCreateDataset.js';
import useDatasetOverview, {
  datasetOverviewQueryKey,
} from '../hooks/useDatasetOverview.js';
import useDatasetRowPages, {
  datasetRowsQueryPrefix,
} from '../hooks/useDatasetRowPages.js';
import { parseCsv } from '../utils/csv.js';
import UploadPage from '../pages/UploadPage.jsx';
import PreviewModal from '../pages/PreviewModal.jsx';
import DetailLoadingPage from '../pages/DetailLoadingPage.jsx';
import DetailPage from '../pages/DetailPage.jsx';
import DetailTabView from '../pages/DetailTabView.jsx';

const PREVIEW_ROW_COUNT = 10;
const INITIAL_PREVIEW_BYTES = 256 * 1024;
const MAX_PREVIEW_BYTES = 10 * 1024 * 1024;
const DATASET_ID_STORAGE_KEY = 'databom.datasetId';

function StoredDatasetDetail({ datasetId, onChangeFile }) {
  const overviewQuery = useDatasetOverview(datasetId);
  const [firstRowsQuery] = useDatasetRowPages(datasetId, [0]);

  if (overviewQuery.isLoading || firstRowsQuery.isLoading) {
    return (
      <DetailLoadingPage
        title="저장된 데이터셋을 불러오고 있어요"
        description="데이터셋 개요와 행 데이터를 다시 조회하고 있습니다."
      />
    );
  }

  if (overviewQuery.isError || firstRowsQuery.isError || !overviewQuery.data) {
    return (
      <main className="detail-loading" role="alert">
        <div className="detail-loading-logo" aria-label="DataBOM">
          <img src="/logo.png" alt="" aria-hidden="true" />
        </div>
        <h1>저장된 데이터셋을 불러오지 못했어요</h1>
        <p>데이터셋이 삭제되었거나 서버에 연결할 수 없습니다.</p>
        <button className="confirm-button" type="button" onClick={onChangeFile}>
          새 파일 선택하기
        </button>
      </main>
    );
  }

  const overview = overviewQuery.data;
  const headers = [...overview.columns]
    .sort((left, right) => left.column_index - right.column_index)
    .map(column => column.name);
  const rows = firstRowsQuery.data?.rows ?? [];
  const restoredData = {
    headers,
    rows,
    totalRows: overview.summary.row_count,
    fileName: overview.original_filename,
    fileSize: overview.summary.size_bytes,
    datasetId,
    dataset: {
      id: datasetId,
      original_filename: overview.original_filename,
      encoding: overview.encoding,
    },
  };

  return <DetailPage data={restoredData} onChangeFile={onChangeFile} />;
}

function decodePreview(buffer, encoding, includeIncompleteLastRow) {
  try {
    const decoderEncoding = encoding === 'cp949' ? 'euc-kr' : encoding;
    const text = new TextDecoder(decoderEncoding).decode(buffer);
    const parsed = parseCsv(text, PREVIEW_ROW_COUNT, { includeIncompleteLastRow });
    return parsed?.headers.length
      ? parsed
      : { error: '미리보기에 표시할 CSV 행을 찾지 못했어요.' };
  } catch {
    return { error: '선택한 인코딩으로 파일을 읽지 못했어요.' };
  }
}

function isUtf8(buffer, completeFile) {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer, { stream: !completeFile });
    return true;
  } catch {
    return false;
  }
}

async function createLocalPreview(file) {
  let sampleSize = Math.min(file.size, INITIAL_PREVIEW_BYTES);

  while (true) {
    const completeFile = sampleSize >= file.size;
    const buffer = await file.slice(0, sampleSize).arrayBuffer();
    const previews = {
      'utf-8': decodePreview(buffer, 'utf-8', completeFile),
      cp949: decodePreview(buffer, 'cp949', completeFile),
    };
    const recommendedEncoding = isUtf8(buffer, completeFile) ? 'utf-8' : 'cp949';
    const recommendedPreview = previews[recommendedEncoding];
    const hasEnoughRows = recommendedPreview?.rows?.length >= PREVIEW_ROW_COUNT;
    const reachedReadLimit = completeFile || sampleSize >= MAX_PREVIEW_BYTES;

    if (hasEnoughRows || reachedReadLimit) {
      return { previews, recommendedEncoding };
    }

    sampleSize = Math.min(sampleSize * 2, file.size, MAX_PREVIEW_BYTES);
  }
}

export default function AppRoutes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createDatasetMutation = useCreateDataset();
  const [storedDatasetId, setStoredDatasetId] = useState(() =>
    window.localStorage.getItem(DATASET_ID_STORAGE_KEY)
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [localPreviews, setLocalPreviews] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [csvEncoding, setCsvEncoding] = useState('utf-8');

  const chooseFile = async file => {
    if (!file) return;
    setPreviewData(null);
    setLocalPreviews(null);
    setDetailData(null);
    setUploadError('');
    setDetailError('');
    if (!/\.csv$/i.test(file.name)) {
      setUploadError('지원하지 않는 파일 형식이에요. CSV 파일을 선택해 주세요.');
      return;
    }
    try {
      setLoadingPreview(true);
      const { previews, recommendedEncoding } = await createLocalPreview(file);
      const availableEncoding = [recommendedEncoding, 'utf-8', 'cp949'].find(
        encoding => previews[encoding]?.headers
      );
      if (!availableEncoding) throw new Error('No available CSV preview');

      const sample = previews[availableEncoding];
      setCsvEncoding(availableEncoding);
      setSelectedFile(file);
      setLocalPreviews(previews);
      setPreviewData({
        ...sample,
        totalRows: sample.rows.length,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch {
      setUploadError('CSV 미리보기를 만들지 못했어요. 파일 형식과 인코딩을 확인해 주세요.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const changeEncoding = encoding => {
    if (!selectedFile || !localPreviews || encoding === csvEncoding) return;
    const sample = localPreviews[encoding];
    if (!sample?.headers) {
      setDetailError(sample?.error ?? '선택한 인코딩으로 파일을 읽지 못했어요.');
      return;
    }

    setCsvEncoding(encoding);
    setDetailError('');
    setPreviewData(current => ({
      ...current,
      ...sample,
      totalRows: sample.rows.length,
    }));
  };

  const loadDetails = async () => {
    if (!selectedFile) return;
    setLoadingDetail(true);
    setDetailError('');
    navigate('/loading');
    try {
      const parseFullFile = selectedFile.arrayBuffer().then(buffer => {
        const decoderEncoding = csvEncoding === 'cp949' ? 'euc-kr' : csvEncoding;
        const parsed = parseCsv(new TextDecoder(decoderEncoding).decode(buffer));
        if (!parsed || !parsed.headers.length) throw new Error('empty CSV');
        return parsed;
      });
      const [fullData, dataset] = await Promise.all([
        parseFullFile,
        createDatasetMutation.mutateAsync({ file: selectedFile, encoding: csvEncoding }),
        new Promise(resolve => window.setTimeout(resolve, 700)),
      ]);
      window.localStorage.setItem(DATASET_ID_STORAGE_KEY, dataset.id);
      setStoredDatasetId(dataset.id);
      setDetailData({
        ...fullData,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        datasetId: dataset.id,
        dataset,
      });
      navigate('/details', { replace: true });
    } catch (error) {
      const serverDetail = error.response?.data?.detail;
      const serverMessage =
        typeof serverDetail === 'string'
          ? serverDetail
          : Array.isArray(serverDetail)
            ? serverDetail[0]?.msg
            : null;
      setDetailError(
        serverMessage
          ? `데이터셋을 생성하지 못했어요. ${serverMessage}`
          : '데이터셋을 생성하지 못했어요. CSV 파일과 서버 연결을 확인한 뒤 다시 시도해 주세요.',
      );
      navigate('/', { replace: true });
    } finally {
      setLoadingDetail(false);
    }
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setLocalPreviews(null);
    setDetailError('');
    navigate('/', { replace: true });
  };

  const startOver = () => {
    if (storedDatasetId) {
      queryClient.removeQueries({ queryKey: datasetOverviewQueryKey(storedDatasetId) });
      queryClient.removeQueries({ queryKey: datasetRowsQueryPrefix(storedDatasetId) });
    }
    window.localStorage.removeItem(DATASET_ID_STORAGE_KEY);
    setStoredDatasetId(null);
    setSelectedFile(null);
    setPreviewData(null);
    setLocalPreviews(null);
    setDetailData(null);
    setUploadError('');
    setDetailError('');
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <UploadPage onChooseFile={chooseFile} loading={loadingPreview} error={uploadError} />
            {previewData && (
              <PreviewModal
                data={previewData}
                error={detailError}
                loading={loadingDetail}
                encoding={csvEncoding}
                encodingLoading={false}
                onEncodingChange={changeEncoding}
                onCancel={cancelPreview}
                onConfirm={loadDetails}
              />
            )}
          </>
        }
      />
      <Route
        path="/loading"
        element={
          selectedFile && previewData ? (
            <DetailLoadingPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/details"
        element={
          detailData ? (
            <DetailPage data={detailData} onChangeFile={startOver} />
          ) : storedDatasetId ? (
            <StoredDatasetDetail datasetId={storedDatasetId} onChangeFile={startOver} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<DetailTabView view="overview" />} />
        <Route path="merge" element={<DetailTabView view="merge" />} />
        <Route path="processing" element={<DetailTabView view="processing" />} />
        <Route path="visualization" element={<DetailTabView view="visualization" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
