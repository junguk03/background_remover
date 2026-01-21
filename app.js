// DOM 요소
const uploadSection = document.getElementById('uploadSection');
const processSection = document.getElementById('processSection');
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const originalImage = document.getElementById('originalImage');
const resultImage = document.getElementById('resultImage');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const progress = document.getElementById('progress');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// 결과 Blob 저장
let resultBlob = null;

// 파일 크기 제한 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 허용 파일 타입
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// 업로드 박스 클릭
uploadBox.addEventListener('click', () => fileInput.click());

// 파일 선택
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

// 드래그 앤 드롭
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

// 파일 처리
function handleFile(file) {
    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
        alert('PNG, JPG, WEBP 이미지만 업로드 가능합니다.');
        return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
    }

    // UI 전환
    uploadSection.style.display = 'none';
    processSection.style.display = 'block';

    // 원본 이미지 표시
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // 배경 제거 실행
    removeBackground(file);
}

// 배경 제거
async function removeBackground(file) {
    try {
        // 로딩 UI 초기화
        loading.style.display = 'block';
        resultImage.style.display = 'none';
        downloadBtn.disabled = true;
        progress.style.width = '0%';

        // 배경 제거 실행
        const blob = await window.imglyRemoveBackground(file, {
            progress: (key, current, total) => {
                // 진행률 업데이트
                const percentage = Math.round((current / total) * 100);
                progress.style.width = `${percentage}%`;

                // 상태 텍스트 업데이트
                if (key === 'fetch:model') {
                    loadingText.textContent = `모델 다운로드 중... ${percentage}%`;
                } else if (key === 'compute:inference') {
                    loadingText.textContent = `배경 분석 중... ${percentage}%`;
                } else {
                    loadingText.textContent = `처리 중... ${percentage}%`;
                }
            }
        });

        // 결과 저장 및 표시
        resultBlob = blob;
        resultImage.src = URL.createObjectURL(blob);
        resultImage.style.display = 'block';
        loading.style.display = 'none';
        downloadBtn.disabled = false;

    } catch (error) {
        console.error('배경 제거 실패:', error);
        loadingText.textContent = '처리 중 오류가 발생했습니다.';
        alert('배경 제거에 실패했습니다. 다시 시도해주세요.');
    }
}

// 다운로드
downloadBtn.addEventListener('click', () => {
    if (!resultBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(resultBlob);
    link.download = `배경제거_${Date.now()}.png`;
    link.click();
});

// 리셋
resetBtn.addEventListener('click', () => {
    // URL 해제
    if (resultImage.src) {
        URL.revokeObjectURL(resultImage.src);
    }

    // 상태 초기화
    resultBlob = null;
    fileInput.value = '';
    originalImage.src = '';
    resultImage.src = '';
    resultImage.style.display = 'none';
    loading.style.display = 'block';
    loadingText.textContent = '모델 로딩 중...';
    progress.style.width = '0%';
    downloadBtn.disabled = true;

    // UI 전환
    processSection.style.display = 'none';
    uploadSection.style.display = 'block';
});
