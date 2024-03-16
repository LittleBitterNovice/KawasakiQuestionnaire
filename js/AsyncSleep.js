
//	非同期で一定時間待機する
async function sleep( msInt )
{
	"use strict";
	
	return new Promise( function( resolveFunc )
	{
		setTimeout( function()
		{
			resolveFunc();
		}, msInt );
	} );
}
