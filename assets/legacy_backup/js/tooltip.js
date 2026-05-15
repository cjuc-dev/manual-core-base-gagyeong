document.addEventListener('DOMContentLoaded', function () {
	const tooltips = document.querySelectorAll('.tooltip');

	tooltips.forEach((tooltip) => {
		const tooltipText = tooltip.querySelector('.tooltip-text');

		tooltip.addEventListener('mouseenter', function () {
			// ✅ 툴팁을 먼저 표시해야 위치를 정확히 계산 가능
			tooltipText.style.visibility = 'visible';
			tooltipText.style.opacity = '1';

			// ✅ 툴팁 위치 계산
			const rect = tooltipText.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const windowWidth = window.innerWidth;

			// 🛠 툴팁이 화면 위로 가려질 경우 아래로 배치
			if (rect.top < 0) {
				tooltipText.style.top = '100%';
				tooltipText.style.bottom = 'auto';
			} else {
				tooltipText.style.top = 'auto';
				tooltipText.style.bottom = '100%';
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
				tooltipText.style.right = 'auto';
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

		// ✅ `mouseleave` 시 툴팁 숨기기
		tooltip.addEventListener('mouseleave', function () {
			tooltipText.style.visibility = 'hidden';
			tooltipText.style.opacity = '0';
		});
	});
});
