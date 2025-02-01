document.addEventListener('DOMContentLoaded', function () {
	var menuItems = document.querySelectorAll('.sidebar ul li > a');

	menuItems.forEach(function (menu) {
		menu.addEventListener('click', function (event) {
			var submenu = this.nextElementSibling;
			if (submenu && submenu.classList.contains('submenu')) {
				event.preventDefault(); // ✅ 기본 링크 이동 방지
				submenu.classList.toggle('show');
			}
		});
	});
});
