import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { parseCsv } from '../utils/csv.js';
import UploadPage from '../pages/UploadPage.jsx';
import PreviewModal from '../pages/PreviewModal.jsx';
import DetailLoadingPage from '../pages/DetailLoadingPage.jsx';
import DetailPage from '../pages/DetailPage.jsx';
import DetailTabView from '../pages/DetailTabView.jsx';
import { useCsvPreview } from '../hooks/useCsvPreview.js';

const DATA_STORAGE_KEY = 'sift:uploaded-dataset';

function readSavedData() {
  try {
    const saved = localStorage.getItem(DATA_STORAGE_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    return Array.isArray(data.headers) && Array.isArray(data.rows) ? data : null;
  } catch {
    return null;
  }
}

function clearSavedData() {
  try {
    localStorage.removeItem(DATA_STORAGE_KEY);
  } catch {
    // Keep the upload flow working if browser storage is unavailable.
  }
}

export default function AppRoutes() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [serverPreviews, setServerPreviews] = useState(null);
  const [detailData, setDetailData] = useState(readSavedData);
  const [uploadError, setUploadError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [csvEncoding, setCsvEncoding] = useState('utf-8');
  const { mutateAsync: requestCsvPreview, isPending: loadingPreview } = useCsvPreview();

  useEffect(() => {
    if (!detailData) return;
    try {
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(detailData));
    } catch {
      // Storage can be full for very large CSV files; keep the current session usable.
    }
  }, [detailData]);

  const chooseFile = async file => {
    if (!file) return;
    setPreviewData(null);
    setServerPreviews(null);
    setDetailData(null);
    clearSavedData();
    setUploadError('');
    setDetailError('');
    if (!/\.csv$/i.test(file.name)) {
      setUploadError('지원하지 않는 파일 형식이에요. CSV 파일을 선택해 주세요.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('파일 크기가 50MB를 초과했어요. 더 작은 CSV 파일을 선택해 주세요.');
      return;
    }

    try {
      const response = await requestCsvPreview(file);
      const availableEncoding = [response.recommended_encoding, 'utf-8', 'cp949'].find(
        encoding => response.previews?.[encoding]?.headers
      );
      if (!availableEncoding) throw new Error('No available CSV preview');

      const sample = response.previews[availableEncoding];
      setCsvEncoding(availableEncoding);
      setSelectedFile(file);
      setServerPreviews(response.previews);
      setPreviewData({
        ...sample,
        totalRows: sample.rows.length,
        fileName: response.filename,
        fileSize: file.size,
      });
    } catch {
      setUploadError('CSV 미리보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const changeEncoding = encoding => {
    if (!selectedFile || !serverPreviews || encoding === csvEncoding) return;
    const sample = serverPreviews[encoding];
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
      const [text] = await Promise.all([
        selectedFile.arrayBuffer(),
        new Promise(resolve => window.setTimeout(resolve, 700)),
      ]);
      const decoderEncoding = csvEncoding === 'cp949' ? 'euc-kr' : csvEncoding;
      const fullData = parseCsv(new TextDecoder(decoderEncoding).decode(text));
      if (!fullData || !fullData.headers.length) throw new Error('empty CSV');
      setDetailData({ ...fullData, fileName: selectedFile.name, fileSize: selectedFile.size });
      navigate('/details', { replace: true });
    } catch {
      setDetailError('파일을 다시 읽지 못했어요. CSV 파일을 확인하고 다시 시도해 주세요.');
      navigate('/', { replace: true });
    } finally {
      setLoadingDetail(false);
    }
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setServerPreviews(null);
    setDetailError('');
    navigate('/', { replace: true });
  };

  const startOver = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setServerPreviews(null);
    setDetailData(null);
    clearSavedData();
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
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        <Route index element={<DetailTabView view="overview" />} />
        <Route path="processing" element={<DetailTabView view="processing" />} />
        <Route path="visualization" element={<DetailTabView view="visualization" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
