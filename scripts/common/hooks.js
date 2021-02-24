import { WrathAndGloryActor } from "./actor.js";
import { WrathAndGloryItem } from "./item.js";
import { AgentSheet } from "../sheet/agent.js";
import { ThreatSheet } from "../sheet/threat.js";
import { KeywordSheet } from "../sheet/keyword.js";
import { TalentSheet } from "../sheet/talent.js";
import { AbilitySheet } from "../sheet/ability.js";
import { PsychicPowerSheet } from "../sheet/psychic-power.js";
import { ArmourSheet } from "../sheet/armour.js";
import { WeaponSheet } from "../sheet/weapon.js";
import { WeaponUpgradeSheet } from "../sheet/weapon-upgrade.js";
import { GearSheet } from "../sheet/gear.js";
import { AscensionSheet } from "../sheet/ascension.js";
import { TraumaticInjurySheet } from "../sheet/traumatic-injury.js";
import { MemorableInjurySheet } from "../sheet/memorable-injury.js";
import { MutationSheet } from "../sheet/mutation.js";
import { AmmoSheet } from "../sheet/ammo.js";
import { AugmenticSheet } from "../sheet/augmentic.js";
import { initializeHandlebars } from "./handlebars.js";
import { migrateWorld } from "./migration.js";
import { prepareCommonRoll, prepareWeaponRoll, prepareDamageRoll, preparePsychicRoll } from "./dialog.js";
import { commonRoll, weaponRoll, damageRoll, psychicRoll, reroll } from "./roll.js";

Hooks.once("init", () => {
  CONFIG.Actor.entityClass = WrathAndGloryActor;
  CONFIG.Item.entityClass = WrathAndGloryItem;
  game.wag = {
    prepareCommonRoll,
    prepareWeaponRoll,
    prepareDamageRoll,
    preparePsychicRoll,
    commonRoll,
    weaponRoll,
    psychicRoll,
    damageRoll,
    reroll,
    executeMacro
  };
  CONFIG.Combat.initiative = { formula: "(@attributes.initiative.total)d6", decimals: 0 };
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("wrath-and-glory", AgentSheet, { types: ["agent"], makeDefault: true });
  Actors.registerSheet("wrath-and-glory", ThreatSheet, { types: ["threat"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("wrath-and-glory", KeywordSheet, { types: ["keyword"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", TalentSheet, { types: ["talent"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", AbilitySheet, { types: ["ability"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", PsychicPowerSheet, { types: ["psychicPower"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", ArmourSheet, { types: ["armour"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", WeaponSheet, { types: ["weapon"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", WeaponUpgradeSheet, { types: ["weaponUpgrade"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", GearSheet, { types: ["gear"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", AscensionSheet, { types: ["ascension"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", TraumaticInjurySheet, { types: ["traumaticInjury"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", MemorableInjurySheet, { types: ["memorableInjury"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", MutationSheet, { types: ["mutation"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", AmmoSheet, { types: ["ammo"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", AmmoSheet, { types: ["ammo"], makeDefault: true });
  Items.registerSheet("wrath-and-glory", AugmenticSheet, { types: ["augmentic"], makeDefault: true });
  initializeHandlebars();
  game.settings.register("wrath-and-glory", "worldSchemaVersion", {
    name: "World Version",
    hint: "Used to automatically upgrade worlds data when the system is upgraded.",
    scope: "world",
    config: true,
    default: 0,
    type: Number,
  });
});

Hooks.once("ready", () => {
  migrateWorld();
});

Hooks.on("preCreateActor", (createData) => {
  mergeObject(createData, {
    "token.bar1": { "attribute": "combat.wounds" },
    "token.bar2": { "attribute": "combat.shock" },
    "token.displayName": CONST.TOKEN_DISPLAY_MODES.HOVER,
    "token.displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS,
    "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    "token.name": createData.name
  });
  if (createData.type === "agent") {
    createData.token.vision = true;
    createData.token.actorLink = true;
  }
});

Hooks.on('hotbarDrop', (bar, data, slot) => {
  createWAGMacro(data, slot);
});

async function createWAGMacro(data, slot) {
  const command = `game.wag.executeMacro("${data.actorId}", "${data.type}", "${data.name}")`;
console.log(data.name);
  let macro = game.macros.entities.find(m => (m.name === data.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: data.name,
      type: "script",
      //img: item.img,
      command: command,
      flags: { "wrath-and-glory.attributeMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

async function executeMacro(actorId, type, name) {
  let actor = game.actors.get(actorId);
  let rank = actor.data.data.advances.rank;
  let roll = actor._defaultRollData(rank);
  
  roll.name = name.toLowerCase();

  if(type == "attribute") {
    //console.log("Attribut!");
    roll.pool.size = actor.data.data.attributes[roll.name].total;
  }

  if (type == "skill") {
    //console.log("Skill!");
    roll.pool.size = actor.data.data.skills[roll.name].total;
  }

  game.wag.prepareCommonRoll(roll);
}