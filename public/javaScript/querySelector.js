document.addEventListener('DOMContentLoaded', function () {
	// ✅ 모든 메뉴의 클릭 이벤트 추가
	const menuItems = document.querySelectorAll('.sidebar ul > li > a');

	menuItems.forEach((menu) => {
		menu.addEventListener('click', function (event) {
			event.preventDefault();

			const submenu = this.nextElementSibling;

			// ✅ 다른 펼쳐진 메뉴는 자동으로 접기
			document.querySelectorAll('.submenu').forEach((item) => {
				if (item !== submenu) {
					item.classList.remove('show');
				}
			});

			// ✅ 클릭한 메뉴의 하위 항목만 토글
			if (submenu) {
				submenu.classList.toggle('show');
			}
		});
	});
});
