function toggleMenu(menuId) {
	var menu = document.getElementById(menuId);

	// ✅ 클릭한 항목이 상위 메뉴인지 확인
	var isTopLevel = menu.parentElement.querySelector('a[onclick^="toggleMenu"]') !== null;

	// ✅ 모든 하위 메뉴 가져오기
	var submenus = document.querySelectorAll('.submenu');

	submenus.forEach(function (submenu) {
		// ✅ 현재 클릭한 항목이 상위 메뉴일 경우에만 다른 열린 메뉴 닫기
		if (isTopLevel && submenu.id !== menuId) {
			submenu.classList.remove('show');
		}
	});

	// ✅ 현재 클릭한 메뉴 토글 (펼치기/닫기)
	menu.classList.toggle('show');
}
