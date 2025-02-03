document.addEventListener('DOMContentLoaded', function () {
	const tooltips = document.querySelectorAll('.tooltip');

	tooltips.forEach((tooltip) => {
		const tooltipText = tooltip.querySelector('.tooltip-text');

		tooltip.addEventListener('mouseenter', function () {
			const rect = tooltipText.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const windowWidth = window.innerWidth;

			// 🛠 툴팁이 화면 위로 가려질 경우 아래로 배치
			if (rect.top < 0) {
				tooltipText.classList.remove('bottom');
				tooltipText.style.top = '100%';
				tooltipText.style.bottom = 'auto';
			} else {
				tooltipText.classList.add('bottom');
			}

			// 🛠 툴팁이 오른쪽을 넘어가면 왼쪽 정렬
			if (rect.right > windowWidth) {
				tooltipText.style.left = 'auto';
				tooltipText.style.right = '0';
				tooltipText.style.transform = 'translateX(0)';
			} else {
				tooltipText.style.left = '50%';
				tooltipText.style.right = 'auto';
				tooltipText.style.transform = 'translateX(-50%)';
			}

			// ✅ **툴팁이 왼쪽을 넘어가면 오른쪽으로 이동**
			if (rect.left < 0) {
				tooltipText.style.left = '10px';
				tooltipText.style.transform = 'none';
			}

			// 🛠 화면 크기에 맞게 툴팁 너비 조정
			if (windowWidth > 1024) {
				tooltipText.style.width = 'auto';
				tooltipText.style.maxWidth = '400px';
			} else {
				tooltipText.style.maxWidth = '90vw';
			}
		});
	});
});
