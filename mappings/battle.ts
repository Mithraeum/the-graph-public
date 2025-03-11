import {BattleEnded} from "../generated/templates/Battle/Battle";

import {Battle} from "../generated/schema";

export function handleBattleEnded(event: BattleEnded): void {
    const battle = Battle.load(event.address.toHex())!;

    battle.status = "FINISHED";
    battle.save();
}
