
const dataSubjects =
[
    "回答ID", "来館目的", "使用部屋", "年齢", "住所1", "住所2", "住所3", "自宅からの時間"
];

window.addEventListener( "load", function()
{
	const bom = new Uint8Array( [ 0xEF, 0xBB, 0xBF ] );
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
    const a = this.document.createElement( "a" );
    a.download = "data.csv";
    a.href = URL.createObjectURL( blob );
    a.click();
    URL.revokeObjectURL( a.href );
    localStorage.clear();
} );
