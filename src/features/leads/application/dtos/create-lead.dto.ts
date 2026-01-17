import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

function AtLeastOneContactMethod(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneContactMethod',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const obj = args.object as CreateLeadDto;
          return !!(obj.email || obj.phone);
        },
        defaultMessage() {
          return 'Either email or phone must be provided';
        },
      },
    });
  };
}

export class CreateLeadDto {
  @ApiProperty({ description: 'Lead name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @AtLeastOneContactMethod()
  name: string;

  @ApiProperty({ description: 'Lead email', example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Lead phone', example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
