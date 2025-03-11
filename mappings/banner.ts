import {Banner, BannersContract} from "../generated/schema";
import {BannerCreated, BannerUpdated} from "../generated/Banner/Banners";
import {BigInt} from "@graphprotocol/graph-ts";

export function handleBannerCreated(event: BannerCreated): void {
    const banner = new Banner(event.params.tokenId.toString());
    banner.bannersContract = event.address.toHex().toLowerCase();
    banner.name = event.params.bannerName;
    banner.save();

    const bannersEntity = BannersContract.load(event.address.toHex().toLowerCase())!;
    bannersEntity.bannersCount = bannersEntity.bannersCount.plus(BigInt.fromI32(1));
    bannersEntity.save();
}

export function handleBannerUpdated(event: BannerUpdated): void {
    const banner = Banner.load(event.params.tokenId.toString())!;

    banner.name = event.params.newBannerName;
    banner.save();
}


