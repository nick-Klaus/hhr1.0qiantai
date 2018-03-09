// var pixelRatio = 1 / window.devicePixelRatio;
	// console.log(pixelRatio);
document.write('<link href="css/first.css?t=' + new Date().getTime() + '" rel="stylesheet" /><link href="css/default.css?t=' + new Date().getTime() + '" rel="stylesheet" />');
	
setRem();
window.addEventListener("orientationchange", setRem, false);
window.addEventListener("resize", setRem, false);      

function setRem(){
	var html = document.getElementsByTagName('html')[0];
	
	var pageWidth = html.getBoundingClientRect().width;
    
	if (window.orientation == 0 || window.orientation == 180) {
        pageWidth = pageWidth > 750 ? 750 : pageWidth;
    } else {
        pageWidth = pageWidth > html.clientHeight ? html.clientHeight : pageWidth;  
    }
	
	html.style.fontSize = pageWidth / 7.5 + "px";

}




