import { gsap } from "gsap";

export const initLandingPage = () => {
  registerGuideScrollAnimation();
  animateCardsShapes();
}

const registerGuideScrollAnimation = () => {
  const steps = document.querySelectorAll('.l-guide-step,.l-guide-arrow');
  for (const step of steps) {
    gsap.fromTo(step, {
      y: 100,
      opacity: 0
    },{
      y: 0,
      opacity: 1,
      scrollTrigger: {
        trigger: step,
        start: 'top bottom+=100px',             // when the top of the trigger hits the bottom of the viewport. +100 to compensate for starting position.
        end: '+=200px',                         // end after scrolling 200px beyond the start
        // scrub: 1,                            // Bind anim progress to scrollbar. takes 1 second to "catch up" to the scrollbar. Disable to just trigger anim on scroll pos.
        toggleActions: "play none none reset"   // Play on trigger, do nothing when leaving, do nothing when entering again backwards and reset when scrolling up past the beginning again
      },
    });
  }
}

const animateCardsShapes = () => {
  const shapeA = '.l-cards-shape.a';
  const shapeB = '.l-cards-shape.b';
  const shapeC = '.l-cards-shape.c';
  const shapeD = '.l-cards-shape.d';

  gsap.fromTo(shapeA, {
    top: "50%",
  }, {
    top: "0%",
    scrollTrigger: {
      trigger: '.l-cards',  // When no start/end pos defined, defaults to start/end of trigger element
      scrub: 1,
    },
  });

  gsap.fromTo(shapeB, {
    top: "60%",
  }, {
    top: "40%",
    scrollTrigger: {
      trigger: '.l-cards',
      scrub: 1,
    },
  });

  gsap.fromTo(shapeC, {
    top: "30%",
  }, {
    top: "10%",
    scrollTrigger: {
      trigger: '.l-cards',
      scrub: 1,
    },
  });

  gsap.fromTo(shapeD, {
    top: "60%",
  }, {
    top: "40%",
    scrollTrigger: {
      trigger: '.l-cards',
      scrub: 1,
    },
  });
}