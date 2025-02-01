document.addEventListener('DOMContentLoaded', function () {
	const homeIcon = document.querySelector('.home-icon img');

	if (homeIcon) {
		homeIcon.addEventListener('mousedown', function () {
			this.style.transform = 'none';
		});

		homeIcon.addEventListener('mouseup', function () {
			this.style.transform = '';
		});
	}
});
