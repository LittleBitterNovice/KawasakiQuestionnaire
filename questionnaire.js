
async function sleep( ms )
{
    return new Promise( function( resolve ) {
        setTimeout( function() {
            resolve();
        }, ms );
    } );
}

history.pushState( null, null, null );
window.addEventListener( "popstate", function()
{
    history.forward();
} );

const dataSubjects =
[
    "回答ID", "来館目的", "使用部屋", "年齢", "住所1", "住所2", "住所3", "自宅からの時間"
];

let answer = "";

window.addEventListener( "load", function()
{
    const sections = document.getElementsByClassName( "questionnaire-page" );
    const nPage = sections.length;
    let page = 0;

    sections[ 0 ].style.display = "block";

    for( let i = 0; i < sections.length; i ++ )
    {
        const buttons = sections[ i ].getElementsByTagName( "button" );

        for( let j = 0; j < buttons.length; j ++ )
        {
            buttons[ j ].name = dataSubjects[ i ];
            buttons[ j ].value = buttons[ j ].textContent;

            buttons[ j ].addEventListener( "click", function()
            {
                if( this.classList.contains( "page-next-button" ) )
                {
                    nextPage();
                }
                if( this.classList.contains( "option-button" ) )
                {
                    addAnswer( this );
                }
            } );
            //    長押しの処理
            if( i === 0 && j === 0 )
            {
                const pressTime = 3000;
                const longpressEvent = new CustomEvent( "longpress", { detail: pressTime.toString() + "ms" } );
                let start, end;
                let timeoutId;
                buttons[ j ].addEventListener( "pointerdown", function()
                {
                    start = performance.now();
                    timeoutId = setTimeout( buttons[ j ].dispatchEvent.bind( buttons[ j ], longpressEvent ), pressTime );
                } );
                buttons[ j ].addEventListener( "longpress", function( lpEvent )
                {
                    if( lpEvent.detail === pressTime.toString() + "ms" )
                    {
                        alert( "入力データをダウンロードしてください" );
                    }
                } );
                buttons[ j ].addEventListener( "pointerup", function()
                {
                    clearTimeout( timeoutId );
                    end = performance.now();
                    if( end - start >= pressTime )
                    {
                        downloadInputData();
                    }
                } );
            }
        }
    }

    navigator.serviceWorker.register( "./sw.js" ).then( function()
    {
        console.log( "ServiceWorker Registration successed" );
    }, function( error )
    {
        console.log( "ServiceWorker Registration errored" );
        console.log( error );
    } );

    function addAnswer( button )
    {
        answer += "," + button.value;
    }

    async function nextPage()
    {
        await sleep(200);
        sections[ page ].style.display = "none";
        page += 1;
        sections[ page ].style.display = "block";

        if( page == ( nPage - 1 ) ) {
            localStorage.setItem( localStorage.length, answer );
            answer = "";
            await sleep( 10000 );
            sections[ page ].style.display = "none";
            page = 0;
            sections[ page ].style.display = "block";
        }
	}
} );

function downloadInputData()
{
    let bom = new Uint8Array( [ 0xEF, 0xBB, 0xBF ] );
    let data = "";
    for( let i = 0; i < dataSubjects.length; i ++ )
    {
        data += dataSubjects[ i ];
        data += ",";
    }
    data += "\n";
    for( let i = 0; i < localStorage.length; i ++ )
    {
        data += String( i );
        data += localStorage[ i ];
        data += "\n";
    }
    const blob = new Blob( [ bom, data ], { type: "text/csv" } );
    const a = window.document.createElement( "a" );
    a.download = "data.csv";
    a.href = URL.createObjectURL( blob );
    a.click();
    URL.revokeObjectURL( a.href );

	if( window.confirm( "入力データを削除しますか？" ) === true )
	{
		localstorage.clear();
	}
}
