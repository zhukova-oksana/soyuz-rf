{
	$('.experts__slider').slick({
		dots: true,
		arrows: true,
		infinite: true,
		speed: 300,
		slidesToShow: 3,		
		slidesToScroll: 1,
		initialSlide: 1,
		centerMode: true,
		centerPadding: '20px',
		variableWidth: true,
		responsive: [			
			{
				breakpoint: 1281,
				settings: {
					slidesToShow: 3,
					variableWidth: true,
					arrows: true,
					centerPadding: '20px',
				}
			},
			{
				breakpoint: 769,
				settings: {
					slidesToShow: 3,
					initialSlide: 1,
					arrows: false,
					variableWidth: true,
					centerMode: true,
				}
			}
		]
	});

	$('.reviews__slider').slick({
		dots: true,
		arrows: true,
		infinite: true,
		speed: 300,
		slidesToShow: 2,		
		slidesToScroll: 1,
		initialSlide: 0,
		// centerMode: true,
		centerPadding: '20px',
		responsive: [			
			{
				breakpoint: 1281,
				settings: {
					slidesToShow: 1,
					initialSlide: 1,
					centerMode: true,
					centerPadding: '0px',
				}
			},
			{
				breakpoint: 769,
				settings: {
					slidesToShow: 3,
					initialSlide: 1,
					centerMode: true,
					centerPadding: '0px',
					variableWidth: true,
					arrows: false,
				}
			}
		]
	});
	$('.cases__slider').slick({
		dots: true,
		arrows: true,
		infinite: true,
		speed: 300,
		slidesToShow: 3,		
		slidesToScroll: 1,
		initialSlide: 0,
		// centerMode: true,
		centerPadding: '20px',
		responsive: [			
			{
				breakpoint: 1270,
				settings: {
					slidesToShow: 3,
					initialSlide: 1,
					centerMode: true,
					variableWidth: true,
					centerPadding: '20px',
				}
			},
			{
				breakpoint: 769,
				settings: {
					slidesToShow: 3,
					initialSlide: 1,
					arrows: false,
					variableWidth: true,
					centerMode: true,
				}
			}
		]
	});

	function changeMarker(el) {			
		if( window.innerWidth >= 1281 ){
      $('.marker').css({				
				'top': el.offsetTop + 'px'
			});
		} else {
			$('.marker').css({		
				// 'width': el.offsetWidth + 'px',				
				// 'top': el.offsetTop + 20 + 'px',
				// 'left': el.offsetLeft + 'px'				
			});
			const scrollContainer = document.querySelector(".menu");			
			scrollContainer.addEventListener("wheel", (evt) => {
					evt.preventDefault();
					scrollContainer.scrollLeft += evt.deltaY;
			});
		} 
	}

	/*<![CDATA[*/
	function tab(el) {
		var menu=el.parentNode;
		var tabs=menu.getElementsByTagName('li');
		for (var i=0; i<tabs.length; i++) {
			var tab=tabs[i];
			var content=document.getElementById(tab.id+'_content');
			// Сделать вкладку активной
			if (tab.id == el.id) {
				changeMarker(el);
				tab.className='menu__active';
				if (content) {
						content.className='specialists__content visible';
				}
			}
			else {
				tab.className='';
				if (content) {
					content.className='specialists__content';
				}
			}
		}
	}
	/*]]>*/

	$('.header__burger').click(function () {
		$(this).toggleClass('open');						
		const panel = document.querySelector('.header__panel');						
		panel.classList.toggle('header__panel_visible');
	});

	$('.header__menu').click(function () {
		const panel = document.querySelector('.header__panel');						
		panel.classList.toggle('header__panel_visible');				
		const burger = document.querySelector('.header__burger');						
		burger.classList.toggle('open');
	});

	$('.header__button_modal').click(function () {
		const panel = document.querySelector('.header__panel');						
		panel.classList.toggle('header__panel_visible');				
		const burger = document.querySelector('.header__burger');						
		burger.classList.toggle('open');
	});

	$('.header__icons').click(function () {
		const panel = document.querySelector('.header__panel');						
		panel.classList.toggle('header__panel_visible');				
		const burger = document.querySelector('.header__burger');						
		burger.classList.toggle('open');
	});


	const disabledScroll = () => {
		document.body.scrollPosition = window.scrollY;
		document.body.style.cssText = `
		overflow:hidden;
		padding-right: ${window.innerWidth - document.body.offsetWidth}px;
		`;
	};

	const enebledScrol = () => {
		document.body.style.cssText = '';
		window.scroll({ top: document.body.scrollPosition });
	};

	const createElem = (tag, attr) => {
		const elem = document.createElement(tag);
		return Object.assign(elem, { ...attr });
	};

	const clearModal = () => {
		const modalContainerElem = document.querySelector('.modal__container');
		modalContainerElem.innerHTML = '';
	}

	const createModal = (className, srcImage, name, info, text) => {		
		const overlayElem = document.querySelector('.overlay');		
		overlayElem.classList.add(`visible`);

		const overlayModalElem = document.querySelector('.modal');
		overlayModalElem.classList.add(`${className}`);
		overlayModalElem.classList.add(`visible`);
		
		const modalElem = document.querySelector('.modal__block');

		const modalContainerElem = document.querySelector('.modal__container');
		modalContainerElem.style.cssText = `background-image: url(${srcImage})`;
		

		const modalName = createElem('p', {
			className: 'modal__name',
			textContent: `${name}`
		});

		const modalInfo = createElem('div', {
			className: 'modal__info',
			innerHTML: `${info}`
		});

		const modalText = createElem('p', {
			className: 'modal__text',
			textContent: `${text}`
		});


		const closeModalBtn = createElem('button', {
			className: 'modal__close',
			innerHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  									<path d="M17 17L7 7M17 7L7 17" stroke="white" stroke-width="1.3" stroke-linecap="round" />
									</svg>`,
			ariaLabel: 'Закрыть модальное окно',
		});
		
		overlayModalElem.addEventListener('click', event => {
			const target = event.target;			
			if (target === overlayElem || target.closest('.modal__close')) {
				overlayElem.classList.remove('visible');
				overlayModalElem.classList.remove('visible');
				overlayModalElem.classList.remove(`${className}`);
				clearModal();
				enebledScrol();
			}
		});

		modalContainerElem.append(closeModalBtn, modalName, modalInfo, modalText);		
		modalElem.append(modalContainerElem);
		overlayModalElem.append(modalElem);
		disabledScroll();		

	};

	let links;

	if( window.innerWidth >= 769 ){
      links = document.querySelectorAll('.cases__link_modal');
		} else {
			links = document.querySelectorAll('.cases__link_mobile_modal');
	} 
	
	const casesCard = document.querySelectorAll('.cases__card');
	const casesInformation = document.querySelectorAll('.cases__information');
	for (let i = 0; i < links.length; i++) {
		links[i].addEventListener('click', () => {			
			let id = links[i].getAttribute('data-src');
			
			const name = casesCard[i].children[1].children[0].textContent;
			const info = casesCard[i].children[1].children[1].innerHTML;
			const text = casesInformation[i].children[1].textContent;
			
			createModal(`modal-${i + 1}`, id, name, info, text);
		});
	}

	const createModalReviews = (className, name, text, info) => {		
		const overlayElem = document.querySelector('.overlay');		
		overlayElem.classList.add(`visible`);

		const overlayModalElem = document.querySelector('.modal');
		overlayModalElem.classList.add('modal-reviews');
		overlayModalElem.classList.add(`${className}`);
		overlayModalElem.classList.add(`visible`);
		
		const modalElem = document.querySelector('.modal__block');
		const modalContainerElem = document.querySelector('.modal__container');

		const modalName = createElem('div', {
			className: 'modal__name',
			textContent: `${name}`
		});

		const modalInfo = createElem('div', {
			className: 'modal__info',
			innerHTML: `${info}`
		});

		const modalText = createElem('div', {
			className: 'modal__text',
			innerHTML: `${text}`
		});


		const closeModalBtn = createElem('button', {
			className: 'modal__close',
			innerHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  									<path d="M17 17L7 7M17 7L7 17" stroke="white" stroke-width="1.3" stroke-linecap="round" />
									</svg>`,
			ariaLabel: 'Закрыть модальное окно',
		});
		
		overlayModalElem.addEventListener('click', event => {
			const target = event.target;			
			if (target === overlayElem || target.closest('.modal__close')) {
				overlayElem.classList.remove('visible');
				overlayModalElem.classList.remove('visible');
				overlayModalElem.classList.remove(`${className}`);
				clearModal();
				enebledScrol();
			}
		});

		modalContainerElem.append(closeModalBtn, modalName, modalText, modalInfo);		
		modalElem.append(modalContainerElem);
		overlayModalElem.append(modalElem);
		disabledScroll();		

	};

	const reviewsBtn = document.querySelectorAll('.reviews__btn');
	const reviewsName = document.querySelectorAll('.reviews__name');
	const reviewsInfo = document.querySelectorAll('.reviews__info');
	const reviewsText = document.querySelectorAll('.reviews__text');
	for (let i = 0; i < reviewsBtn.length; i++) {
		reviewsBtn[i].addEventListener('click', () => {									
			const name = reviewsName[i].textContent;
			const info = reviewsInfo[i].innerHTML;
			const text = reviewsText[i].innerHTML;
			
			createModalReviews(`modal-reviews_${i}`, name, text, info);
		});
	}

	const videoPlay = document.querySelector('.promo__btn');
	const idVideo = videoPlay.getAttribute('data-video');

	videoPlay.addEventListener('click', () => {
		const containerVideo = document.querySelector('.promo__video');
		const iframeVideo = createElem('iframe', {
			className: 'promo__iframe',
			width: '100%',
			height: '100%',
			src: `https://www.youtube.com/embed/${idVideo}?autoplay=1&mute=1`,
		});
		iframeVideo.setAttribute('allowFullScreen', '');
		containerVideo.append(iframeVideo);
	});
	

	
	const overlayModal = document.querySelector('.modal-success');	
	overlayModal.addEventListener('click', event => {
		const target = event.target;		
		if (target === overlayModal || target.closest('.modal__close')) {	
			overlayModal.classList.remove('visible');
			enebledScrol();
		}
	});
}