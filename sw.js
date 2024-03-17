
//	キャッシュするファイル
const cacheName = "KawasakiQuestionnaire";
const cacheFileURLs = [
	"index.html",
	"questionnaire.css",
	"questionnaire.js",
	"css/PageLayout.css",
	"css/DynamicPage.css",
	"js/ManipulateString.js",
	"js/GetChildrenElement.js",
	"js/AsyncSleep.js",
	"js/ForbidHistoryBack.js",
	"js/DynamicPage.js",
	"img/KawasakiBrandSymbol.svg",
	"img/KawasakiBrandLogo.png"
];

//	インストール時にファイルをキャッシュする
self.addEventListener( "install", async function ( eventObj )
{
	await eventObj.waitUntil( caches.open( cacheName ).then( async function ( cacheObj )
	{
		return cacheObj.addAll( cacheFileURLs );
	} ) );
	console.log( "ServiceWorker installed and cached files" );
} );

//	リクエスト時にキャッシュされたファイルを返す
self.addEventListener( "fetch", function ( eventObj )
{
	eventObj.respondWith( caches.match( eventObj.request ).then( async function ( responseObj )
	{
		if( typeof responseObj !== "undefined" )
		{
			console.log( "ServiceWorker fetched ", eventObj.request.url );
			return responseObj;
		}
		//	リクエストされたファイルがキャッシュに存在しない場合、新たに要求ファイルをキャッシュする
		else if( typeof responseObj === "undefined" )
		{
			const fetchResponse = fetch( eventObj.request ).then( async function ( newResponseObj )
			{
				return caches.open( cacheName ).then( async function ( cacheObj )
				{
					return cacheObj.put( eventObj.request, newResponseObj.clone() );
				} );
			} );
			console.log( "ServiceWorker cached ", fetchResponse.url );
			return fetchResponse;
		}
	} ) );
} );
