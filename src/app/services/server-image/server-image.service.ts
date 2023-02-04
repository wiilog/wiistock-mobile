import {Injectable} from "@angular/core";
import {ServerImageKeyEnum} from '@app/services/server-image/server-image-key.enum';
import {Observable, of, zip} from 'rxjs';
import {StorageService} from '@app/services/storage/storage.service';
import {StorageKeyEnum} from '@app/services/storage/storage-key.enum';
import {map, tap} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class ServerImageService {

    private static CACHED_IMAGES: {[key: string]: string} = {};

    private static readonly CACHE_KEY: {[key: string]: StorageKeyEnum} = {
        [ServerImageKeyEnum.HEADER_IMAGE_KEY]: StorageKeyEnum.IMAGE_SERVER_HEADER,
        [ServerImageKeyEnum.LOGIN_IMAGE_KEY]: StorageKeyEnum.IMAGE_SERVER_LOGIN
    }

    public constructor(private storageService: StorageService) {
    }

    public loadFromStorage(): Observable<void> {
        return zip(
            ...Object
                .keys(ServerImageService.CACHE_KEY)
                .map((key: string) => (
                    this.storageService
                        .getString(ServerImageService.CACHE_KEY[key])
                        .pipe(tap((value) => {
                            if (value) {
                                ServerImageService.CACHED_IMAGES[key] = value;
                            }
                        }))
                ))
        )
            .pipe(map(() => undefined));
    }

    public saveToStorage(): Observable<void> {
        const cachedImages = Object
            .keys(ServerImageService.CACHED_IMAGES)
            .filter((key) => ServerImageService.CACHED_IMAGES[key]);
        return cachedImages.length > 0
            ? zip(
                ...cachedImages
                    .map((key) => this.storageService.setItem(ServerImageService.CACHE_KEY[key], ServerImageService.CACHED_IMAGES[key]))
            ).pipe(map(() => undefined))
            : of(undefined);
    }

    public saveOneToStorage(key: ServerImageKeyEnum, value: string): Observable<void> {
        ServerImageService.CACHED_IMAGES[key] = value;
        return this.storageService.setItem(ServerImageService.CACHE_KEY[key], value).pipe(map(() => undefined));
    }

    public get(key: ServerImageKeyEnum): string {
        return ServerImageService.CACHED_IMAGES[key];
    }
}
