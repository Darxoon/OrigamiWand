export enum DataType {
	None,
	
	// dispos
	Npc,
	Item,
	Mobj,
	Aobj,
	BShape,
	Maplink,
	Hand,
	Hariko,
	Hole,
	Effect,
	Sobj,
	Gobj,
	
	Lobj,
	DigPoint,
	
	ResourceGobj,
	
	// data
	DataNpc,
	DataItem,
	DataMap,
	DataHariko,
	DataMobj,
	DataAobj,
	
	// data_model.elf
	DataNpcModel,
	DataItemModel,
	DataGobjModel,
	DataHarikoModel,
	DataNaviModel,
	DataMobjModel,
	DataPlayerModel,
	DataModelEnd,
	
	DataItemSet,
	
	// misc data.elf types
	// DataMuseum,
	DataConfettiTotalHoleInfo,
	DataEffect,
	DataMaplinkZoom,
	DataParty,
	DataUi,
	DataBtl,
	DataBtlSet,
	
	// this is the end of the actual file types
	TypeAmount,
	
	MaplinkHeader,
	
	ModelAssetGroup,
	ModelState,
	ModelFaceGroup,
	ModelFace,
	ModelAnimation,
	
	ConfettiVersion,
	ConfettiData,
	ConfettiMap,
	ConfettiHole,
	
	UiModel,
	UiModelProperty,
	UiMsg,
	UiShop,
	UiSellItem,
	UiSeaMap,
	UiMenu,
	UiAnnouncement,
	UiAnnouncementExclude,
	
	BtlModel,
	BtlPart,
	BtlUnit,
	BtlAttackRangeHeader,
	BtlAttackRange,
	BtlAttack,
	BtlEventCamera,
	BtlBossAttack,
	BtlPuzzleLevel,
	BtlCheerTerms,
	BtlCheer,
	BtlResourceField,
	BtlResource,
	BtlConfig,
	
	SetAreaReference,
	SetBattle,
	SetEnemy,
}
