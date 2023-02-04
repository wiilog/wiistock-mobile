import {Injectable} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class FileService {

    public static readonly SIGNATURE_IMAGE_EXTENSION = 'jpeg';
    public static readonly SIGNATURE_IMAGE_TYPE = 'image/jpeg';

    public createFile(dataURL: string, extension: string, type: string, fileName: string): File {
        // Split the base64 string in data and contentType
        const block = dataURL.split(";");

        // get the real base64 content of the file
        const realData = block[1].split(",")[1];

        let sliceSize = 1024;
        let byteCharacters = atob(realData);
        let bytesLength = byteCharacters.length;
        let slicesCount = Math.ceil(bytesLength / sliceSize);
        let byteArrays = new Array(slicesCount);

        for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
            let begin = sliceIndex * sliceSize;
            let end = Math.min(begin + sliceSize, bytesLength);

            let bytes = new Array(end - begin);
            for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
                bytes[i] = byteCharacters[offset].charCodeAt(0);
            }
            byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        return new File(
            byteArrays,
            `${fileName}.${extension}`,
            {type}
        );
    }

    public getBase64FromFile(file: File): Observable<string> {
        const res$ = new ReplaySubject<string>(1);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            res$.next(reader.result as string);
            res$.complete();
        };
        reader.onerror = (error) => {
            res$.error(error);
            res$.complete();
        };
        return res$;
    }
}
