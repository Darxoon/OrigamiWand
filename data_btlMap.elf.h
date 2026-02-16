typedef unsigned char   undefined;

typedef unsigned char    byte;
typedef unsigned int    dword;
typedef unsigned long    qword;
typedef unsigned char    undefined1;
typedef unsigned short    word;
typedef struct Elf64_Ehdr Elf64_Ehdr, *PElf64_Ehdr;

struct Elf64_Ehdr {
    byte e_ident_magic_num;
    char e_ident_magic_str[3];
    byte e_ident_class;
    byte e_ident_data;
    byte e_ident_version;
    byte e_ident_osabi;
    byte e_ident_abiversion;
    byte e_ident_pad[7];
    word e_type;
    word e_machine;
    dword e_version;
    qword e_entry;
    qword e_phoff;
    qword e_shoff;
    dword e_flags;
    word e_ehsize;
    word e_phentsize;
    word e_phnum;
    word e_shentsize;
    word e_shnum;
    word e_shstrndx;
};

typedef struct Elf64_Rela Elf64_Rela, *PElf64_Rela;

struct Elf64_Rela {
    qword r_offset; /* location to apply the relocation action */
    qword r_info; /* the symbol table index and the type of relocation */
    qword r_addend; /* a constant addend used to compute the relocatable field value */
};

typedef struct Elf64_Shdr Elf64_Shdr, *PElf64_Shdr;

typedef enum Elf_SectionHeaderType_AARCH64 {
    SHT_NULL=0,
    SHT_PROGBITS=1,
    SHT_SYMTAB=2,
    SHT_STRTAB=3,
    SHT_RELA=4,
    SHT_HASH=5,
    SHT_DYNAMIC=6,
    SHT_NOTE=7,
    SHT_NOBITS=8,
    SHT_REL=9,
    SHT_SHLIB=10,
    SHT_DYNSYM=11,
    SHT_INIT_ARRAY=14,
    SHT_FINI_ARRAY=15,
    SHT_PREINIT_ARRAY=16,
    SHT_GROUP=17,
    SHT_SYMTAB_SHNDX=18,
    SHT_ANDROID_REL=1610612737,
    SHT_ANDROID_RELA=1610612738,
    SHT_GNU_ATTRIBUTES=1879048181,
    SHT_GNU_HASH=1879048182,
    SHT_GNU_LIBLIST=1879048183,
    SHT_CHECKSUM=1879048184,
    SHT_SUNW_move=1879048186,
    SHT_SUNW_COMDAT=1879048187,
    SHT_SUNW_syminfo=1879048188,
    SHT_GNU_verdef=1879048189,
    SHT_GNU_verneed=1879048190,
    SHT_GNU_versym=1879048191,
    SHT_AARCH64_ATTRIBUTES=1879048195
} Elf_SectionHeaderType_AARCH64;

struct Elf64_Shdr {
    dword sh_name;
    enum Elf_SectionHeaderType_AARCH64 sh_type;
    qword sh_flags;
    qword sh_addr;
    qword sh_offset;
    qword sh_size;
    dword sh_link;
    dword sh_info;
    qword sh_addralign;
    qword sh_entsize;
};

typedef struct Elf64_Sym Elf64_Sym, *PElf64_Sym;

struct Elf64_Sym {
    dword st_name;
    byte st_info;
    byte st_other;
    word st_shndx;
    qword st_value;
    qword st_size;
};

typedef struct ElementData ElementData, *PElementData;

struct ElementData {
    int s_mobjElementData_W0C1;
    int field1_0x4;
    pointer field2_0x8;
    int field3_0x10;
    int field4_0x14;
    int field5_0x18;
    int field6_0x1c;
    int field7_0x20;
    int field8_0x24;
    int field9_0x28;
    int field10_0x2c;
    float field11_0x30;
    float field12_0x34;
    float field13_0x38;
    int field14_0x3c;
    int field15_0x40;
    int field16_0x44;
    float field17_0x48;
    float field18_0x4c;
    float field19_0x50;
    float field20_0x54;
    pointer field21_0x58;
};

typedef struct mapData mapData, *PmapData;

struct mapData {
    pointer s_mapData;
    pointer field1_0x8;
    pointer field2_0x10;
    pointer field3_0x18;
    int field4_0x20;
    int field5_0x24;
    int field6_0x28;
    int field7_0x2c;
    int field8_0x30;
    int field9_0x34;
    int field10_0x38;
    int field11_0x3c;
    int field12_0x40;
    float field13_0x44;
    float field14_0x48;
    float field15_0x4c;
    undefined * field16_0x50;
    undefined * field17_0x58;
    undefined * field18_0x60;
    undefined * field19_0x68;
    float field20_0x70;
    float field21_0x74;
    float field22_0x78;
    float field23_0x7c;
    float field24_0x80;
    float field25_0x84;
    float field26_0x88;
    float field27_0x8c;
    float field28_0x90;
    float field29_0x94;
    float field30_0x98;
    float field31_0x9c;
    int field32_0xa0;
    int field33_0xa4;
    pointer field34_0xa8;
    pointer field35_0xb0;
    pointer field36_0xb8;
    pointer field37_0xc0;
};

typedef struct mobjDataBattle mobjDataBattle, *PmobjDataBattle;

struct mobjDataBattle {
    pointer s_mobjData_battle_MobjW0C1;
    pointer field1_0x8;
    int field2_0x10;
    int field3_0x14;
    pointer field4_0x18;
    pointer field5_0x20;
    int field6_0x28;
    int field7_0x2c;
    int field8_0x30;
    int field9_0x34;
    int field10_0x38;
    int field11_0x3c;
    int field12_0x40;
    int field13_0x44;
};

