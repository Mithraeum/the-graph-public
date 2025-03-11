import {Banner, Building, Distribution, DistributionTokenHolder} from "../generated/schema";
import {Address, BigInt, Bytes, log} from "@graphprotocol/graph-ts";
import { TransferBatch, TransferSingle } from "../generated/Distributions/Distributions";
import {Distributions as DistributionsContract} from "../generated/Distributions/Distributions"
import {Building as BuildingContract} from "../generated/templates/Building/Building"

function getBuildingAddressByDistributionId(distributionsAddress: string, distributionId: BigInt): string {
  const distributionsInstance = DistributionsContract.bind(Address.fromString(distributionsAddress));

  let callResult = distributionsInstance.try_distributionIdToBuildingAddress(distributionId);
  if(!callResult.reverted) {
    return callResult.value.toHex().toLowerCase();
  }

  throw new Error("UNABLE_TO_GET_BUILDING_ADDRESS_BY_DISTRIBUTION_ID");
}

function getEraNumberByBuildingAddress(buildingAddress: string): BigInt {
    const buildingInstance = BuildingContract.bind(Address.fromString(buildingAddress));

    let callResult = buildingInstance.try_eraNumber();
    if(!callResult.reverted) {
        return callResult.value;
    }

    throw new Error("UNABLE_TO_GET_ERA_NUMBER_BY_BUILDING_ADDRESS");
}

function handleTransfer(
  distributionsAddress: string,
  fromAddress: string,
  toAddress: string,
  distributionId: BigInt,
  amount: BigInt,
  timestamp: BigInt
): void {
  const buildingAddress = getBuildingAddressByDistributionId(distributionsAddress, distributionId);
  const distributionEntity = Distribution.load(distributionId.toHex());

  //from,to,id,value id=building
  let distributionTokenHolderReceiver = DistributionTokenHolder.load(distributionId.toHex() + toAddress);
  if (distributionTokenHolderReceiver == null) {
    if (distributionEntity != null) {
      distributionEntity.distributionTokenHoldersCount = distributionEntity.distributionTokenHoldersCount.plus(BigInt.fromI32(1));
      distributionEntity.save();
    }

    distributionTokenHolderReceiver = new DistributionTokenHolder(distributionId.toHex() + toAddress);
    distributionTokenHolderReceiver.eraNumber = getEraNumberByBuildingAddress(buildingAddress);
    distributionTokenHolderReceiver.userAddress = Address.fromString(toAddress);
    distributionTokenHolderReceiver.building = buildingAddress;
    distributionTokenHolderReceiver.createdAt = timestamp;
    distributionTokenHolderReceiver.amount = BigInt.fromI32(0);
    distributionTokenHolderReceiver.distribution = distributionId.toHex();
  }

  distributionTokenHolderReceiver.updatedAt = timestamp;
  distributionTokenHolderReceiver.amount = distributionTokenHolderReceiver.amount.plus(amount);
  distributionTokenHolderReceiver.save();

  const buildingTokenHolderSender = DistributionTokenHolder.load(distributionId.toHex() + fromAddress);
  if (buildingTokenHolderSender == null) {
    //Same as mint
    return;
  }

  buildingTokenHolderSender.updatedAt = timestamp;
  buildingTokenHolderSender.amount = buildingTokenHolderSender.amount.minus(amount);

  // if sender new amount is zero -> he is not holder anymore -> reduce total active holders
  if (distributionEntity != null) {
    if (buildingTokenHolderSender.amount.equals(BigInt.fromI32(0))) {
      distributionEntity.distributionTokenHoldersCount = distributionEntity.distributionTokenHoldersCount.minus(BigInt.fromI32(1));
      distributionEntity.save();
    }
  }

  buildingTokenHolderSender.save();
}

export function handleTransferSingle(event: TransferSingle): void {
  const fromAddress = event.params.from.toHex().toLowerCase();
  const toAddress = event.params.to.toHex().toLowerCase();

  const distributionId = event.params.id;
  const amount = event.params.value;

  handleTransfer(
    event.address.toHex().toLowerCase(),
    fromAddress,
    toAddress,
    distributionId,
    amount,
    event.block.timestamp,
  );
}

export function handleTransferBatch(event: TransferBatch): void {
  const fromAddress = event.params.from.toHex();
  const toAddress = event.params.to.toHex();

  for (let i = 0; i < event.params.ids.length; i++) {
    const distributionId = event.params.ids[i];
    const amount = event.params.values[i];

    handleTransfer(
      event.address.toHex(),
      fromAddress,
      toAddress,
      distributionId,
      amount,
      event.block.timestamp,
    );
  }
}
