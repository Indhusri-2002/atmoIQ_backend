import { IsLatitude, IsLongitude } from 'class-validator';

export class AirPollutionQueryDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lon: number;
}
