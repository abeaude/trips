gsap.registerPlugin(ScrollTrigger);

const path = document.querySelector("#route");
const svgMap = document.querySelector("#svgmap")
const divs = document.querySelectorAll('.journey-section');
const markers = document.querySelectorAll('#markers circle');
const container = document.querySelector('.container');
const pathLength = path.getTotalLength();
const journeySteps = ["paris", "cologne", "hambourg", "stockholm", "lulea", "abisko", "stockholm"];
const stepsLabel = Array.from(document.querySelector("#labels").children)
let stepViewBoxMap = new Map();
stepViewBoxMap.set(1, "95 210 65 30")
stepViewBoxMap.set(3, "122 190 70 30")
stepViewBoxMap.set(5, "112 145 75 5")
stepViewBoxMap.set(7, "160 60 55 15")
stepViewBoxMap.set(9, "175 20 55 20")
stepViewBoxMap.set(11, "112 145 75 5")

function getIndex(arr, v) {
    if (v < arr[0]) return -1
    for (var i = 1; i < arr.length; i++) {
        if (v >= arr[i - 1] && v < arr[i]) return i - 1;
    }
    return i
}

// Initially hide the path
gsap.set(path, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength
});

var divTopSteps = [];
var divBottomSteps = [];
var progressSteps = [];
divs.forEach((div, index) => {
    const divTop = div.offsetTop;
    const divBottom = divTop + div.offsetHeight;
    divTopSteps.push(divTop);
    divBottomSteps.push(divBottom)
    const h = window.innerHeight;
    div.setAttribute("style", "margin-bottom:" + h + "px");
});
for (let i = 0; i < divBottomSteps.length - 1; i++) {
    progressSteps.push((divBottomSteps[i] - container.offsetTop) / (container.offsetHeight - window.innerHeight), (divTopSteps[i + 1] - container.offsetTop) / (container.offsetHeight - window.innerHeight))
}
progressSteps.push((divBottomSteps[divBottomSteps.length - 1] - container.offsetTop) / (container.offsetHeight - window.innerHeight))

var markersPositionOnPath = [];
markers.forEach((m, index) => {
    let minimumDistance = Infinity
    let closestLength = 0
    const cx = m.getAttribute("cx")
    const cy = m.getAttribute("cy")
    for (let i = 0; i < 2 * pathLength; i++) {
        const x = path.getPointAtLength(i / 2).x
        const y = path.getPointAtLength(i / 2).y
        const distanceToPath = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2)
        if (distanceToPath < minimumDistance) {
            minimumDistance = distanceToPath
            closestLength = i / 2
        }
    }
    markersPositionOnPath.push(closestLength)
});
// handle return to stockholm 
const stockholm2 = document.querySelector("#marker-stockholm")
let minimumDistance = Infinity
let closestLength = 0
const cx = stockholm2.getAttribute("cx")
const cy = stockholm2.getAttribute("cy")
for (let i = 0; i < 2 * pathLength; i++) {
    const x = path.getPointAtLength(i / 2).x
    const y = path.getPointAtLength(i / 2).y
    const distanceToPath = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2)
    if (distanceToPath < minimumDistance) {
        minimumDistance = distanceToPath
        closestLength = i / 2
    }
}
markersPositionOnPath.push(closestLength)

// Create ScrollTrigger animation
let tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        snap: false,
        pin: false,
        markers: false,
        onUpdate: self => {
            // Animate path drawing based on scroll progress
            const progress = self.progress;
            const index = getIndex(progressSteps, progress);
            if (index >= 0 && index % 2 == 0) {
                stepsLabel.forEach((txt, index) => {
                    txt.setAttribute("visibility", "visible")
                })
                gsap.to(svgMap, { attr: { viewBox: "0 0 235 320" }, ease: "sine.out" })
                const step = index / 2
                const scrollPathDistance = Math.abs(markersPositionOnPath[step + 1] - markersPositionOnPath[step])
                const stepPercentage = (progress - progressSteps[index]) / (progressSteps[index + 1] - progressSteps[index]);
                var correctedProgress = (markersPositionOnPath[step] + stepPercentage * scrollPathDistance) / pathLength
                if (correctedProgress > 1) correctedProgress = 1;

                gsap.to(path, {
                    strokeDashoffset: pathLength - (pathLength * correctedProgress),
                    duration: 0.1,
                    ease: "none"
                });
            } else if (index % 2 == 1 && index < progressSteps.length) {
                gsap.to(svgMap, { attr: { viewBox: stepViewBoxMap.get(index) }, ease: "sine.in" })
                stepsLabel.forEach((txt, idx) => {
                    if (!txt.id.includes(journeySteps[~~(index / 2) + 1])) txt.setAttribute("visibility", "hidden")
                })
            }
        },
        onEnter: self => {
            gsap.to(svgMap, { attr: { viewBox: "60 240 60 20" }, ease: "sine.in" })
            stepsLabel.forEach((txt, index) => {
                if (!txt.id.includes("paris")) txt.setAttribute("visibility", "hidden")
            })
        },
        onLeave: self => {
            gsap.to(svgMap, { attr: { viewBox: "0 0 235 320" }, ease: "sine.out" })
            stepsLabel.forEach((txt, index) => {
                txt.setAttribute("visibility", "visible")
            })
        },
        onLeaveBack: self => {
            gsap.to(svgMap, { attr: { viewBox: "0 0 235 320" }, ease: "sine.out" })
            stepsLabel.forEach((txt, index) => {
                txt.setAttribute("visibility", "visible")
            })
        }
    }
});
