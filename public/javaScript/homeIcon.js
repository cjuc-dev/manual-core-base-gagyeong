document.addEventListener('DOMContentLoaded', function () {
	const homeIcon = document.querySelector('.home-icon img');

	if (homeIcon) {
		// ✅ 클릭 시 스타일이 변경되지 않도록 강제 적용
		homeIcon.addEventListener('mousedown', function () {
			this.style.transform = 'none';
			this.style.transition = 'none';
		});

		homeIcon.addEventListener('mouseup', function () {
			this.style.transform = 'none';
			this.style.transition = 'none';
		});

		homeIcon.addEventListener('click', function () {
			this.style.transform = 'none';
			this.style.transition = 'none';
		});
	}
});
