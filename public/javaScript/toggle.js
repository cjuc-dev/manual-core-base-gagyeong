// 펼치기 접기 함수
function toggleDiv(id) {
	var div = document.getElementById(id); // ✅ ID에 해당하는 <div> 요소를 가져옴
	if (div.style.display === 'none' || div.style.display === '') {
		div.style.display = 'block'; // ✅ 펼치기
	} else {
		div.style.display = 'none'; // ✅ 닫기
	}
}
