
//	ユーザーの入力項目
const userInputSubjects = [
	{ subject: "purpose",	question: "本日の来館目的" },
	{ subject: "room",		question: "使用する部屋" },
	{ subject: "age",		question: "ご年齢" },
	{ subject: "address-1",	question: "お住まい" },
	{ subject: "address-2",	question: "" },
	{ subject: "address-3",	question: "" },
	{ subject: "time",		question: "ご自宅からの時間" }
];
let userInput = [];

//	DOMコンテンツをロードしてからの処理
document.addEventListener( "DOMContentLoaded", function()
{
	//	メインDPの設定
	const questionnaire = document.getElementById( "questionnaire" );
	const mainDPContainer = getChildElementById( questionnaire, "questionnaire-dp-container" );
	const adminPage = getDirectChildElementById( mainDPContainer, "administrator-page" );
	const startPage = getDirectChildElementById( mainDPContainer, "start-greeting-page" );
	const questionPage = getDirectChildElementById( mainDPContainer, "question-page" );
	const endPage = getDirectChildElementById( mainDPContainer, "end-greeting-page" );

	const mainDP = new DynamicPage( mainDPContainer );
	const adminPageName = adminPage.getAttribute( "data-dp-name" );
	const startPageName = startPage.getAttribute( "data-dp-name" );
	const questionPageName = questionPage.getAttribute( "data-dp-name" );
	const endPageName = endPage.getAttribute( "data-dp-name" );
	mainDP.createPage( adminPageName, adminPage );
	mainDP.createPage( startPageName, startPage );
	mainDP.createPage( questionPageName, questionPage );
	mainDP.createPage( endPageName, endPage );
	
	//	スタートボタン押下時の処理を設定
	const startButton = getChildElementById( startPage, "start-button" );
	startButton.addEventListener( "click", async function()
	{
		questionnaire.inert = true;
		await sleep( 200 );
		await mainDP.generateEvent( "next" );
		questionnaire.inert = false;
	} );
	//	長押しで管理者ページに移動
	const pressTime = 3000;
	let timeoutId;
	startButton.addEventListener( "pointerdown", function ()
	{
		const longpressEvent = new CustomEvent( "longpress", { detail: pressTime.toString() + "ms" } );
		timeoutId = setTimeout( startButton.dispatchEvent.bind( startButton, longpressEvent ), pressTime );
	} );
	startButton.addEventListener( "pointermove", function ()
	{
		clearTimeout( timeoutId );
	} );
	startButton.addEventListener( "pointerup", async function ()
	{
		clearTimeout( timeoutId );
	} );
	startButton.addEventListener( "longpress", async function ( lpEvent )
	{
		if( lpEvent.detail === pressTime.toString() + "ms" )
		{
			alert( "管理者ページに移動します" );
			questionnaire.inert = true;
			await sleep( 200 );
			mainDP.generateEvent( "prev" );
			questionnaire.inert = false;
		}
	} );

	//	管理者ページの処理を設定
	//	ヘッダーのボタンでlocalStorageのデータを削除/保存する
	const adminHeaderNav = getDirectChildElementById( adminPage, "administrator-page-header" );
	const dataDeleteButton = getDirectChildElementById( adminHeaderNav, "data-delete-button" );
	const dataDonloadButton = getDirectChildElementById( adminHeaderNav, "data-download-button" );
	dataDeleteButton.addEventListener( "click", async function ()
	{
		const confirmMessage =
			"ローカルストレージに保存されたアンケートデータを削除します\n" +
			"CSVファイルが正常にダウンロードされていることを確認してください";
		const confirmed = confirm( confirmMessage );
		if( confirmed === true )
		{
			localStorage.clear();
			clearLocalStorageTable();
		}
	} );
	//	localStorageのデータをCSV形式でダウンロードする
	dataDonloadButton.addEventListener( "click", function ()
	{
		const csvLines = [];
		csvLines.push( "回答ID," );
		userInputSubjects.forEach( function ( subjectObj )
		{
			console.log( subjectObj );
			csvLines[ 0 ] += subjectObj.question + ",";
		} );
		for( let i = 0; i < localStorage.length; i ++ )
		{
			csvLines.push( localStorage.getItem( i ) );
		}
		downloadCSVFile( csvLines );
	} );
	//	テーブルを作成してlocalStorageのデータを表示する
	createLocalStorageTable();
	//	フッターのボタンで回答者ページに戻る
	const adminFooterNav = getDirectChildElementById( adminPage, "administrator-page-footer" );
	const escapeAdminButton = getDirectChildElementById( adminFooterNav, "escape-admin-button" );
	escapeAdminButton.addEventListener( "click", mainDP.generateEvent.bind( mainDP, "next" ) );

	//	エンドページ遷移時の処理を設定
	mainDP.addEventListener( "afterMove", async function()
	{
		if( mainDP.isPage( endPageName ) === true )
		{
			//	ユーザーの入力をlocaltorageに保存し、10秒待ってからDPをリセットする
			questionnaire.inert = true;
			let index = 0;
			let storedText = localStorage.length.toString() + ",";
			userInputSubjects.forEach( function ( subjectObj )
			{
				if( subjectObj.subject !== userInput[ index ].subject )
				{
					storedText += ",";
				}
				else if( subjectObj.subject === userInput[ index ].subject )
				{
					storedText += userInput[ index ].answer + ",";	
					index ++;
				}
			} );
			localStorage.setItem( localStorage.length, storedText );
			addLineLocalStorageTable();
			userInput = [];
			await sleep( 10000 );
			mainDP.generateEvent( "exit" );
			mainDP.generateEvent( "enter" );
			questionnaire.inert = false;
		}
	} );

	//	設問DPの設定
	const questionDPContainer = getChildElementById( questionPage, "question-page-dp-container" );
	const questionDPPages = getDirectChildrenArrayByClassName( questionDPContainer, "dp-page" );

	const questionDP = new DynamicPage( questionDPContainer );
	mainDP.insertNestedDP( questionPageName, questionDP );
	questionDPPages.forEach( function( pageElem )
	{
		const pageName = pageElem.getAttribute( "data-dp-name" );
		questionDP.createPage( pageName, pageElem );
		//	入れ子DPを持たないページのボタン押下時の処理を設定
		if( pageElem.classList.contains( "dp-container" ) === false )
		{
			setDPPageButtonAction( questionDP, pageElem );
		}
		//	入れ子DPの設定
		else if( pageElem.classList.contains( "dp-container" ) === true )
		{
			const nestedDP = new DynamicPage( pageElem );
			questionDP.insertNestedDP( pageName, nestedDP );
			const nestedDPPages = getDirectChildrenArrayByClassName( pageElem, "dp-page" );
			nestedDPPages.forEach( function( nestedDPPageElem )
			{
				const nestedDPPageName = nestedDPPageElem.getAttribute( "data-dp-name" );
				nestedDP.createPage( nestedDPPageName, nestedDPPageElem );
				//	入れ子DPのページのボタン押下時の処理を設定
				setDPPageButtonAction( nestedDP, nestedDPPageElem );
			} );
		}
	} );

	//	設問ページのフッターナビの設定
	const questionPageFooter = getChildElementById( questionPage, "question-page-footer" );
	const prevButton = getChildElementById( questionPageFooter, "footer-prev-button" );

	//	戻るボタン押下時の処理を設定
	prevButton.addEventListener( "click", async function()
	{
		questionnaire.inert = true;
		userInput.pop();
		await sleep( 200 );
		await mainDP.frontDP.generateEvent( "prev" );
		questionnaire.inert = false;
	} );

	//	mainDPを開始する
	mainDP.generateEvent( "enter" );

	//	ブラウザバックを禁止する
	forbidHistoryBack();

	//	DPページ内のボタン押下時の処理を設定する関数
	function setDPPageButtonAction( DPObj, DPPageElem )
	{
		const optionsContainer = getDirectChildElementById( DPPageElem, DPPageElem.id.slice( 0, - "page".length ) + "options-container" );
		const optionButtons = getDirectChildrenArrayByClassName( optionsContainer, "option-button" );
		optionButtons.forEach( function( buttonElem )
		{
			buttonElem.addEventListener( "click", async function()
			{
				const questionSubject = buttonElem.getAttribute( "name" );
				const buttonText = buttonElem.innerText;
				questionnaire.inert = true;
				userInput.push( {
					subject: questionSubject,
					answer: buttonText
				} );
				await sleep( 200 );
				const DPAction = buttonElem.getAttribute( "data-dp-action" );
				let eventType;
				let argObj = {};
				//	moveイベントの場合、引数オブジェクトを決定する
				if( DPAction.slice( 0, "move".length ) === "move" )
				{
					eventType = "move";
					if( DPAction.slice( "move".length, "move".length + "To".length ) === "To" )
					{
						argObj = { destIndex: parseInt( DPAction.slice( "move".length + "To".length ) ) };
					}
					else
					{
						argObj = { variation: parseInt( DPAction.slice( "move".length ) ) };
					}
				}
				else
				{
					eventType = DPAction;
				}
				await DPObj.generateEvent( eventType, argObj );
				questionnaire.inert = false;
			} );
		} );
	}

	//	CSVファイルをダウンロードする関数
	function downloadCSVFile( csvLines )
	{
		const bom = new Uint8Array( [ 0xEF, 0xBB, 0xBF ] );
		const blob = new Blob( [ bom, csvLines.join( "\n" ) ], { type: "text/csv" } );
		const a = window.document.createElement( "a" );
		a.download = "questonnaireData.csv";
		a.href = URL.createObjectURL( blob );
		a.click();
		URL.revokeObjectURL( a.href );
	}

	//	localStorageのデータ（tbodyの中の要素）を削除する
	function clearLocalStorageTable()
	{
		const table = getChildElementById( adminPage, "administrator-page-table" );
		const body = table.children[ 1 ];
		const rows = body.children;
		while( rows.length > 0 )
		{
			rows[ rows.length - 1 ].remove();
		}
	}
	//	localStorageのデータを追加する
	function addLineLocalStorageTable()
	{
		const table = getChildElementById( adminPage, "administrator-page-table" );
		const body = table.children[ 1 ];
		const row = document.createElement( "tr" );
		body.appendChild( row );
		localStorage.getItem( localStorage.length - 1 ).slice( 0, -1 ).split( "," ).forEach( function ( answerStr )
		{
			const cell = document.createElement( "td" );
			row.appendChild( cell );
			cell.innerText = answerStr;
	} );
}
	//	localStorageのデータを表示するテーブルを作成する
	function createLocalStorageTable()
	{
		const table = getChildElementById( adminPage, "administrator-page-table" );
		const header = document.createElement( "thead" );
		table.appendChild( header );
		const headerRow = document.createElement( "tr" );
		header.appendChild( headerRow );
		const headerFirstCell = document.createElement( "th" );
		headerFirstCell.innerText = "回答ID";
		headerRow.appendChild( headerFirstCell );
		userInputSubjects.forEach( function ( subjectObj )
		{
			const cell = document.createElement( "th" );
			headerRow.appendChild( cell );
			cell.innerText = subjectObj.question;
		} );
		const body = document.createElement( "tbody" );
		table.appendChild( body );
		for( let i = 0; i < localStorage.length; i ++ )
		{
			const row = document.createElement( "tr" );
			body.appendChild( row );
			localStorage.getItem( i ).slice( 0, -1 ).split( "," ).forEach( function ( answerStr )
			{
				const cell = document.createElement( "td" );
				row.appendChild( cell );
				cell.innerText = answerStr;
			} );
		}
	}

	//	サービスワーカーの登録
	if( "serviceWorker" in navigator )
	{
		navigator.serviceWorker.register( "sw.js" ).then( function ()
		{
			console.log( "ServiceWorker Registration successed" );
		}, function ( error )
		{
			console.log( "ServiceWorker Registration errored" );
			console.log( error );
		} );
	}
} );
