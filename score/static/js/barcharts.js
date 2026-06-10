(function(){
    var bars = document.querySelectorAll('.rbar-fill[data-w]');
    if(!bars.length || !('IntersectionObserver' in window)) {
        bars.forEach(function(b){ b.style.width = b.dataset.w + '%'; });
        return;
    }
    var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
            if(e.isIntersecting){
                e.target.style.width = e.target.dataset.w + '%';
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    bars.forEach(function(b){ io.observe(b); });
}());
