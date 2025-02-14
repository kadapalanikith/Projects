document.querySelectorAll('.navbar-nav .nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
        var navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler.getAttribute('aria-expanded') === 'true') {
            navbarToggler.click(); // Trigger the click event on the navbar toggler
        }
    });
});

var mybutton = document.getElementById("backToTopBtn");


window.onscroll = function() {
    scrollFunction()
};

function scrollFunction() {
    if (document.body.scrollTop > 30 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
