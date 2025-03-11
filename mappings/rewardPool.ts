// import {
//     EthBalanceUpdated,
//     LastSyncedTokenBalanceUpdated,
//     ToBeRepaidTokenAmountUpdated
// } from "../generated/RewardPool/RewardPool";
// import {RewardPool} from "../generated/schema";
//
// export function handleLastSyncedTokenBalanceUpdated(event: LastSyncedTokenBalanceUpdated): void {
//     const rewardPoolEntity = RewardPool.load(event.address.toHex());
//     if (rewardPoolEntity == null) {
//         return;
//     }
//
//     rewardPoolEntity.lastSyncedTokenBalance = event.params.newLastSyncedTokenBalance;
//     rewardPoolEntity.save();
// }
//
// export function handleToBeRepaidTokenAmountUpdated(event: ToBeRepaidTokenAmountUpdated): void {
//     const rewardPoolEntity = RewardPool.load(event.address.toHex());
//     if (rewardPoolEntity == null) {
//         return;
//     }
//
//     rewardPoolEntity.toBeRepaidTokenAmount = event.params.newToBeRepaidTokenAmount;
//     rewardPoolEntity.save();
// }
//
// export function handleEthBalanceUpdated(event: EthBalanceUpdated): void {
//     const rewardPoolEntity = RewardPool.load(event.address.toHex());
//     if (rewardPoolEntity == null) {
//         return;
//     }
//
//     rewardPoolEntity.ethBalance = event.params.newEthBalance;
//     rewardPoolEntity.save();
// }