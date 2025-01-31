// 팝업 열기 함수
function openPopup(src) {
	var popup = document.getElementById('popup'); // 팝업 요소를 가져옴
	var popupImg = document.getElementById('popup-img'); // 팝업 안의 이미지 요소를 가져옴

	// 팝업을 화면에 표시
	popup.style.display = 'flex'; // 팝업을 'flex'로 설정하여 화면 중앙에 표시되도록 함

	// 클릭한 이미지의 src를 팝업 이미지의 src로 설정
	popupImg.src = src; // 팝업에 클릭한 이미지 주소를 삽입
}

// 팝업 닫기 함수
function closePopup() {
	var popup = document.getElementById('popup'); // 팝업 요소를 가져옴
	// 팝업을 숨김
	popup.style.display = 'none'; // 팝업을 닫을 때 'none'으로 설정하여 숨김
}
