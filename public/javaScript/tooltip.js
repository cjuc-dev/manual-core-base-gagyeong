document.addEventListener('DOMContentLoaded', function () {
	const tooltips = document.querySelectorAll('.tooltip-text');

	tooltips.forEach((tooltip) => {
		const parent = tooltip.parentElement;
		parent.addEventListener('mouseenter', function () {
			const rect = tooltip.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			const viewportWidth = window.innerWidth;

			// 화면 아래쪽에서 넘칠 경우
			if (rect.bottom > viewportHeight) {
				tooltip.classList.add('bottom-check');
			} else {
				tooltip.classList.remove('bottom-check');
			}

			// 화면 오른쪽에서 넘칠 경우
			if (rect.right > viewportWidth) {
				tooltip.classList.add('right-check');
			} else {
				tooltip.classList.remove('right-check');
			}
		});
	});
});
