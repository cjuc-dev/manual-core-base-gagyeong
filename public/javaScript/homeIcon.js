document.addEventListener('DOMContentLoaded', function () {
	const homeIcon = document.querySelector('.home-icon img');

	if (homeIcon) {
		homeIcon.addEventListener('mousedown', function () {
			this.style.transform = 'none';
			this.style.transition = 'none';
		});

		homeIcon.addEventListener('mouseup', function () {
			this.style.transform = '';
			this.style.transition = 'transform 0.3s ease-in-out';
		});

		homeIcon.addEventListener('click', function () {
			this.style.transform = 'none';
		});
	}
});
