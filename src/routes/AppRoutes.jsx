import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { parseCsv } from '../utils/csv.js';
import UploadPage from '../pages/UploadPage.jsx';
import PreviewModal from '../pages/PreviewModal.jsx';
import DetailLoadingPage from '../pages/DetailLoadingPage.jsx';
import DetailPage from '../pages/DetailPage.jsx';
import { ROUTES } from './paths.js';

export default function AppRoutes() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const chooseFile = async (file) => {
    if (!file) return;
    setPreviewData(null);
    setDetailData(null);
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

    setLoadingPreview(true);
    try {
      const [text] = await Promise.all([
        file.slice(0, Math.min(file.size, 512 * 1024)).text(),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      const sample = parseCsv(text, 5);
      if (!sample || !sample.headers.length) {
        setUploadError('CSV에서 미리보기 데이터를 찾지 못했어요. 파일 내용을 확인해 주세요.');
        return;
      }
      setSelectedFile(file);
      setPreviewData({ ...sample, fileName: file.name, fileSize: file.size });
    } catch {
      setUploadError('파일을 읽지 못했어요. CSV 파일을 다시 확인해 주세요.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadDetails = async () => {
    if (!selectedFile) return;
    setLoadingDetail(true);
    setDetailError('');
    navigate(ROUTES.loading);
    try {
      const [text] = await Promise.all([
        selectedFile.text(),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      const fullData = parseCsv(text);
      if (!fullData || !fullData.headers.length) throw new Error('empty CSV');
      setDetailData({ ...fullData, fileName: selectedFile.name, fileSize: selectedFile.size });
      navigate(ROUTES.details, { replace: true });
    } catch {
      setDetailError('파일을 다시 읽지 못했어요. CSV 파일을 확인하고 다시 시도해 주세요.');
      navigate(ROUTES.upload, { replace: true });
    } finally {
      setLoadingDetail(false);
    }
  };

  const cancelPreview = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setDetailError('');
    navigate(ROUTES.upload, { replace: true });
  };

  const startOver = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setDetailData(null);
    setUploadError('');
    setDetailError('');
    navigate(ROUTES.upload, { replace: true });
  };

  return (
    <Routes>
      <Route path={ROUTES.upload} element={<><UploadPage onChooseFile={chooseFile} loading={loadingPreview} error={uploadError} />{previewData && <PreviewModal data={previewData} error={detailError} loading={loadingDetail} onCancel={cancelPreview} onConfirm={loadDetails} />}</>} />
      <Route path={ROUTES.loading} element={selectedFile && previewData ? <DetailLoadingPage /> : <Navigate to={ROUTES.upload} replace />} />
      <Route path={`${ROUTES.details}/*`} element={detailData ? <DetailPage data={detailData} onChangeFile={startOver} /> : <Navigate to={ROUTES.upload} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.upload} replace />} />
    </Routes>
  );
}
