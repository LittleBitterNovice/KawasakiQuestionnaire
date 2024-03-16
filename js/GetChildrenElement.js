
//	指定された要素の子孫要素をidで取得する
function getChildElementById( parentElem, idStr )
{
	"use strict";

	//	直下子要素から探す
	const directChildren = parentElem.children;
	for( let i = 0; i < directChildren.length; i ++ )
	{
		const childElement = directChildren[ i ];
		if( childElement.id === idStr )
		{
			return childElement;
		}
		//	直下子要素が対象の要素出なかった場合、再帰的に探す
		const filteredChild = getChildElementById( childElement, idStr );
		if( filteredChild !== null )
		{
			return filteredChild;
		}
	}

	//	子孫要素になかった場合、nullを返す
	return null;
}

//	全直下子要素を取得してcallback関数により絞り込む
//	callback関数は単一のHTMLElementを引数として論理値を返す
function getDirectChildrenArray( parentElem, callbackFunc )
{
	"use strict";

	const filteredChildren = new Array();
	const directChildren = parentElem.children;
	for( let i = 0; i < directChildren.length; i ++ )
	{
		const childElem = directChildren[ i ];
		if( callbackFunc( childElem ) === true )
		{
			filteredChildren.push( childElem );
		}
	}

	return filteredChildren;
}

//	直下子要素をidで取得する
function getDirectChildElementById( parentElem, idStr )
{
	"use strict";
	
	const filteredChildren = getDirectChildrenArray( parentElem, function( childElem )
	{
		return childElem.id === idStr;
	} );
	
	//	対象要素が見つからなかった場合、nullを返す
	if( filteredChildren.length === 0 )
	{
		return null;
	}
	return filteredChildren[ 0 ];
}
//	直下子要素をclassで取得する
function getDirectChildrenArrayByClassName( parentElem, classStr )
{
	"use strict";

	return getDirectChildrenArray( parentElem, function( childElem )
	{
		return childElem.classList.contains( classStr );
	} );
}
