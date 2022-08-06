import { Request } from 'express';

const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

export const fileFilter = ( req: Request, file: Express.Multer.File, callback: Function ) => {

    if ( !file )
        return callback( null, false );

    const fileExtension = file.mimetype.split('/')[1];
    if ( !validExtensions.includes( fileExtension ) )
        return callback( null, false );

    return callback( null, true );
}
