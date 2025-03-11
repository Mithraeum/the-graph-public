import {RegionIncluded} from "../generated/Geography/Geography";
import {Geography, IncludedRegion} from "../generated/schema";
import {BigInt} from "@graphprotocol/graph-ts";

export function handleNewRegionIncluded(event: RegionIncluded): void {
  const geographyAddress = event.address.toHex();
  const newRegionId = event.params.regionId;

  const regionGeographyEntity = new IncludedRegion(newRegionId.toString());
  regionGeographyEntity.geography = geographyAddress;
  regionGeographyEntity.regionId = newRegionId;
  regionGeographyEntity.save();

  const geographyEntity = Geography.load(geographyAddress)!;
  geographyEntity.includedRegionsCount = geographyEntity.includedRegionsCount.plus(BigInt.fromI32(1));
  geographyEntity.save();
}
