const pills = document.querySelectorAll(".pill");
const panels = document.querySelectorAll(".panel");
const header = document.querySelector(".site-header");

pills.forEach(pill => {
    pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        pill.classList.add("active");
        document.getElementById(pill.dataset.target).classList.add("active");
    });
});

const toggleHeaderOnScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 10);
};

window.addEventListener("scroll", toggleHeaderOnScroll, { passive: true });
window.addEventListener("load", toggleHeaderOnScroll);
