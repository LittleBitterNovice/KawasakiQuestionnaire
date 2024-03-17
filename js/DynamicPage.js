
//	動的ページのイベントクラス
class DPEvent extends CustomEvent
{
	//	staticパブリックプロパティ
	static kinds = Object.freeze( [		//	イベントの種類の配列
		"enter",	//	DPの開始
		"exit",		//	DPの終了（リセット）
		"move",		//	ページ移動
		"next",		//	1ページ前進
		"prev",		//	1ページ後退
		"nextOver",		//	終端オーバー
		"prevOver"		//	始端オーバー
	] );
	static types = Object.freeze(		//	イベントタイプの配列
		DPEvent.kinds.map( function( kindStr )
		{
			return [ "before" + capitalizeStr( kindStr ), "after" + capitalizeStr( kindStr ) ];
		} ).flat( Infinity )
	);

	//	コンストラクタ
	constructor( typeStr, detailObj = {} )
	{
		//	イベントタイプとして無効値が指定された場合、エラーを投げる
		if( DPEvent.types.includes( typeStr ) === false )
		{
			throw new Error( "arg typeStr is invalid..." );
		}
		//	キャンセル可能なイベントを生成する
		const options = {
			detail: detailObj,
			bubbles: false,
			cancelable: true,
			composed: false
		};
		super( typeStr, options );
	}
}

//	動的ページのページ移動アニメーションの設定クラス
class DPAnimation
{
	//	staticパブリックプロパティ
	static directions = Object.freeze( [	//	ページ移動の方向の配列
		"LtoR",		//	左から右
		"RtoL",		//	右から左
		"UtoD",		//	上から下
		"DtoU"		//	下から上
	] );
	static basicOptions = Object.freeze( {		//	ページ移動アニメーションの基本オプション
		duration: 400,		//	アニメーション持続時間
		easing: "ease"		//	アニメーションの緩急
	} );

	//	プロパティ
	#container = null;		//	DPコンテナのHTML要素
	#direction = "";		//	ページ移動の方向
	#CSSProperty = "";		//	ページ移動アニメーションで動かすCSSプロパティ
	#CSSValue = "";			//	ページ移動アニメーションで動かすCSSプロパティの値
	#basisProperty = "";	//	ページ移動アニメーションの基準となるCSSプロパティ
	#keyFrame = null;		//	ページ移動アニメーションのキーフレームオブジェクト
	#options = null;		//	ページ移動アニメーションのオプションオブジェクト

	//	コンストラクタ
	constructor( containerElem, directionStr )
	{
		this.#container = containerElem;
		//	ページ移動方向として無効値が指定された場合、エラーを投げる
		if( DPAnimation.directions.includes( directionStr ) === false )
		{
			throw new Error( "arg directionStr is invalid..." );
		}
		this.#direction = directionStr;
		//	ページ移動アニメーションの設定
		switch( this.#direction )
		{
			case "LtoR":
				this.#CSSProperty = "marginLeft";
				this.#basisProperty = "width";
				break;
			case "RtoL":
				this.#CSSProperty = "marginRight";
				this.#basisProperty = "width";
				break;
			case "UtoD":
				this.#CSSProperty = "marginTop";
				this.#basisProperty = "height";
				break;
			case "DtoU":
				this.#CSSProperty = "marginBottom";
				this.#basisProperty = "height";
				break;
		}
		//	キーフレーム/オプションオブジェクトの初期化
		this.#keyFrame = new Object();
		this.#options = JSON.parse( JSON.stringify( DPAnimation.basicOptions ) );
	}

	//	ページ移動アニメーションのオプションを初期化する
	initOptions()
	{
		this.#options = JSON.parse( JSON.stringify( DPAnimation.basicOptions ) );
	}
	//	ページ移動アニメーションのオプションを変更する
	changeOptions( nameStr, valueStr )
	{
		this.#options[ nameStr ] = valueStr;
	}

	//	アニメーションの引数を返す
	outputArgArray( forwardBool )
	{
		//	ページ移動前後の要素の配置を計算する
		this.#CSSValue = "-" + window.getComputedStyle( this.#container ).getPropertyValue( this.#basisProperty );
		if( forwardBool === true )
		{
			this.#keyFrame[ this.#CSSProperty ] = [ "0px", this.#CSSValue ];
		}
		else if( forwardBool === false )
		{
			this.#keyFrame[ this.#CSSProperty ] = [ this.#CSSValue, "0px" ];
		}
		
		return [ this.#keyFrame, this.#options ];
	}
}

//	動的ページクラス
class DynamicPage extends EventTarget
{
	//	プロパティ
	#container = null;		//	コンテナのHTML要素
	#animation = null;		//	ページ移動アニメーションの設定オブジェクト
	#pages = [];		//	コンテナの持つページ（HTML要素）の配列
	#indexes = {};		//	インデックスの連想配列{ pageName : pageIndex }
	#initial = 0;		//	初期ページのインデックス
	#children = {};		//	入れ子DPの連想配列{ pageIndex : childDP }

	#index = 0;		 	//	現在表示しているページのインデックス（ページ非表示のとき-1）

	//	コンストラクタ
	constructor( containerElem )
	{
		super();
		this.#container = containerElem;
		const direction = this.#container.getAttribute( "data-dp-direction" );
		//	ページ移動の方向として無効値が指定された場合、エラーを投げる
		if( DPAnimation.directions.includes( direction ) === false )
		{
			throw new Error( "read direction is invalid..." );
		}
		this.#animation = new DPAnimation( this.#container, direction );
	}

	//	getter
	get containerElem()
	{
		return this.#container;
	}
	get #nPage()
	{
		return this.#pages.length;
	}
	get #nChildren()
	{
		return Object.keys( this.#children ).length;
	}
	//	アクティブなDPのうち最も深い階層にあるDPを返す
	get frontDP()
	{
		//	ページ非表示の場合、nullを返す
		if( this.#index === -1 )
		{
			return null;
		}
		//	入れ子DPの数が0，もしくは現在のページにアクティブな入れ子DPを持たない場合、thisを返す
		if( this.#nChildren === 0 || this.#index in this.#children === false )
		{
			return this;
		}
		const childDP = this.#children[ this.#index ];
		if( childDP.isActive() === false )
		{
			return this;
		}
		
		//	入れ子DPのゲッターを再帰的に呼び出す
		return childDP.frontDP;
	}

	//	ページを作成する
	createPage( nameStr, pageElem )
	{
		//	ページ名としてすでに存在するページ名が指定された場合、エラーを投げる
		if( nameStr in this.#indexes )
		{
			throw new Error( "arg nameStr is already existed in this.indexes..." );
		}
		this.#indexes[ nameStr ] = this.#nPage;
		//	ページ作成直後に非表示にする
		this.#pages.push( pageElem );
		if( pageElem.getAttribute( "data-dp-initial-page" ) === "true" )
		{
			this.#initial = this.#indexes[ nameStr ];
		}
		this.#hidePage( this.#indexes[ nameStr ] );
	}
	//	既存のページに入れ子DPを挿入する
	insertNestedDP( nameStr, childDP )
	{
		//	ページ名として存在しないページ名が指定された場合、エラーを投げる
		if( nameStr in this.#indexes === false )
		{
			throw new Error( "arg nameStr is not existed in this.indexes..." );
		}
		const childIndex = this.#indexes[ nameStr ];
		this.#children[ childIndex ] = childDP;
		//	親DPの開始/終了イベントで入れ子DPを開始/終了する
		this.addEventListener( "afterEnter", childDP.generateEvent.bind( childDP, "enter" ) );
		this.addEventListener( "afterExit", childDP.generateEvent.bind( childDP, "exit" ) );
		//	入れ子DPの始端/終端オーバーイベントで親DPのページを移動させる
		const parentDP = this;
		childDP.addEventListener( "afterPrevOver", parentDP.generateEvent.bind( parentDP, "prev" ) );
		childDP.addEventListener( "afterNextOver", parentDP.generateEvent.bind( parentDP, "next" ) );
	}

	//	ページ移動アニメーションのオプションを初期化する
	initAniOptions()
	{
		this.#animation.initOptions();
	}
	//	ページ移動アニメーションのオプションを変更する
	changeAniOptions( nameStr, valueStr )
	{
		this.#animation.changeOptions( nameStr, valueStr );
	}

	//	アクティブなDPか判定する
	isActive()
	{
		if( this.#index === -1 )
		{
			return false;
		}
		return true;
	}
	//	有効なページインデックスか判定する
	isValidIndex( indexInt )
	{
		if( Number.isInteger( indexInt ) )
		{
			if( indexInt >= 0 && indexInt < this.#nPage )
			{
				return true;
			}
		}
		return false;
	}
	//	有効なページ名か判定する
	isValidPageName( nameStr )
	{
		if( typeof nameStr === "string" || nameStr instanceof String )
		{
			if( nameStr in this.#indexes )
			{
				return true;
			}
		}
		return false;
	}
	//	現在のページが指定されたページか判定する
	isPage( nameStr )
	{
		//	ページ名として無効値が指定された場合、エラーを投げる
		if( this.isValidPageName( nameStr ) === false )
		{
			throw new Error( "arg nameStr is invalid..." );
		}

		if( this.#index === this.#indexes[ nameStr ] )
		{
			return true;
		}
		return false;
	}

	//	ページを表示する
	#displayPage( indexInt )
	{
		//	インデックスとして無効値が指定された場合、エラーを投げる
		if( this.isValidIndex( indexInt ) === false )
		{
			throw new Error( "arg indexInt is invalid..." );
		}

		this.#pages[ indexInt ].setAttribute( "data-dp-display", "display" );
	}
	//	ページを非表示にする
	#hidePage( indexInt )
	{
		//	インデックスとして無効値が指定された場合、エラーを投げる
		if( this.isValidIndex( indexInt ) === false )
		{
			throw new Error( "arg indexInt is invalid..." );
		}

		this.#pages[ indexInt ].setAttribute( "data-dp-display", "hide" );
	}

	//	DPを開始する
	enterDP()
	{
		//	初期ページを表示する
		this.#index = this.#initial;
		this.#displayPage( this.#index );
		return true;
	}
	//	DPを終了する（ページを非表示にする）
	exitDP()
	{
		//	ページを非表示にして移動履歴を初期化する
		this.#hidePage( this.#index );
		this.#index = -1;
		return true;
	}

	//	ページを移動する（表示ページを変更する）
	async movePage( { destName = "", destIndex = -1, variation = 0, overFlag = true, historyBackFlag = false, aniFlag = true } = {} )
	{
		if( this.isValidPageName( destName ) === true )
		{
			destIndex = this.#indexes[ destName ];
		}
		//	移動先インデックスが負の場合、変化量を用いて移動先インデックスを決定する
		if( destIndex < 0 )
		{
			destIndex = this.#index + variation;
		}
		if( overFlag === false )
		{
			//	移動先インデックスとして無効値が指定された場合、エラーを投げてrejectする
			if( this.isValidIndex( destIndex ) === false )
			{
				throw new Error( "arg destinationIndex is invalid..." );
			}
		}
		else if( overFlag === true )
		{
			//	移動先インデックスが始端/終端以降になる場合、始端/終端オーバーイベントを発生させて結果の論理値をresolveする
			if( destIndex < 0 )
			{
				return await this.generateEvent( "prevOver" );
			}
			else if( destIndex >= this.#nPage )
			{
				return await this.generateEvent( "nextOver" );
			}
		}

		//	移動が発生しない場合はfalseをresolveする
		if( destIndex === this.#index )
		{
			return false;
		}
		//	ページを移動してtrueをresolveする
		this.#displayPage( destIndex );
		if( aniFlag === true )
		{
			const aniElem = this.#pages[ Math.min( this.#index, destIndex ) ];
			await aniElem.animate( ...this.#animation.outputArgArray( destIndex > this.#index ) ).finished;
		}
		this.#hidePage( this.#index );
		this.#index = destIndex;
		return true;
	}

	//	イベントを発生させる
	async generateEvent( kindStr, argObj = {} )
	{
		//	イベントタイプとして無効値が指定された場合、エラーを投げてrejectする
		if( DPEvent.kinds.includes( kindStr ) === false )
		{
			throw new Error( "arg typeStr is invalid..." );
		}

		let successed;
		const detailObj = {};
		//	事前イベントを発生させ、キャンセルされなければ処理をトリガする
		successed = this.dispatchEvent( new DPEvent( "before" + capitalizeStr( kindStr ) ), detailObj );
		if( successed === true )
		{
			try {
				switch( kindStr )
				{
					case "enter":
						this.enterDP();
						break;
					case "exit":
						this.exitDP();
						break;
					case "move":
						detailObj.argObj = argObj;
						detailObj.isMoved = await this.movePage( argObj );
						break;
					case "next":
						argObj.variation = 1;
						detailObj.isMoved = await this.generateEvent( "move", argObj );
						break;
					case "prev":
						argObj.variation = -1;
						detailObj.isMoved = await this.generateEvent( "move", argObj );
						break;
					case "nextOver":
					case "prevOver":
						break;
				}
			}
			catch( except ) {
				throw except;
			}
			//	事後イベントを発生させる
			successed = this.dispatchEvent( new DPEvent( "after" + capitalizeStr( kindStr ), detailObj ) );
		}
		//	キャンセルされたかどうかの論理値をresolveする
		return successed;
	}
}
