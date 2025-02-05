// 📌 홈페이지 접속 시 공지사항 팝업 자동 실행
window.onload = function () {
	openNoticePopup();
};

function openNoticePopup() {
	let popupWidth = 500; // 팝업 창 너비
	let popupHeight = 550; // 팝업 창 높이
	let left = (screen.width - popupWidth) / 2;
	let top = (screen.height - popupHeight) / 2;

	// 📌 공지사항 URL (필요에 따라 변경)
	let noticeUrl = 'https://manual-5d03dc.gitlab.io/noticePopup.html';

	let popupWindow = window.open(
		noticeUrl,
		'noticePopup',
		`width=${popupWidth}, height=${popupHeight}, top=${top}, left=${left}, resizable=yes, scrollbars=yes`
	);

	// 📌 팝업 차단 확인
	if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
		alert('팝업 차단이 감지되었습니다. 팝업 차단을 해제하고 다시 시도하세요.');
	}
}
