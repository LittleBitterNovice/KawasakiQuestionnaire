
//	文字列かどうかを判定する
function isString( argStr )
{
	"use strict";
	
	if( typeof argStr === "string" )
	{
		return true;
	}
	//	Stringコンストラクタ経由でインスタンス化されていた場合の判定
	else if( typeof argStr === "object" )
	{
		if( argStr instanceof String )
		{
			return true;
		}
	}
	
	return false;
}

//	先頭文字を大文字にした文字列を返す
function capitalizeStr( originalStr )
{
	"use strict";
	
	//	引数が文字列でない場合はエラーを投げる
	if( isString( originalStr ) === false )
	{
		throw new Error( "arg originalStr is not string..." );
	}

	return originalStr.charAt( 0 ).toUpperCase() + originalStr.slice( 1 );
}
