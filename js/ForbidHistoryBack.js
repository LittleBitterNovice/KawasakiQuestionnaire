
//	ブラウザバックを禁止
function forbidHistoryBack()
{
	"use strict";
	
	window.history.pushState( null, null, null );
	window.addEventListener( "popstate", function()
	{
		window.history.forward();
	} );
}
