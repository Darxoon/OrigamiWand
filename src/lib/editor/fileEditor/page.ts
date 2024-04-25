import type { DataType } from "paper-mario-elfs/dataType"
import type { ElfBinary } from "paper-mario-elfs/elfBinary"
import type { UuidTagged } from "paper-mario-elfs/valueIdentifier"

export interface CardList {
    type: "cardList"
    
    binary: ElfBinary
    dataType: DataType
    overrideObjects?: UuidTagged[]
}

export interface WelcomeScreen {
    type: "welcomeScreen"
}

export type PageContent = CardList | WelcomeScreen
