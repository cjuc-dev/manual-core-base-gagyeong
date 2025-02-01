function toggleImagePopup() {
	var popup = document.getElementById('image-popup');

	if (!popup) {
		console.error('❌ 이미지 팝업 요소를 찾을 수 없습니다.');
		return;
	}

	// ✅ `show` 클래스 토글 방식 사용
	popup.classList.toggle('show');

	// ✅ 상태 로그 출력
	if (popup.classList.contains('show')) {
		console.log('✅ 이미지 팝업 열림');
	} else {
		console.log('✅ 이미지 팝업 닫힘');
	}
}
