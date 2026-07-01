import { ApiProperty } from '@nestjs/swagger';

class NutrientEquivalence {
    @ApiProperty()
    grams!: number;

    @ApiProperty()
    equivalentUnits!: number; // Cucharaditas

    @ApiProperty()
    percentageOfDailyLimit!: number; // % consumido del día
}

class ExerciseRequired {
    @ApiProperty()
    totalCaloriesToBurn!: number;

    @ApiProperty()
    minutesWalking!: number;

    @ApiProperty()
    minutesRunning!: number;
}

export class EvaluationResponseDto {
    @ApiProperty()
    sugar!: NutrientEquivalence;

    @ApiProperty()
    saturatedFat!: NutrientEquivalence;

    @ApiProperty()
    exercise!: ExerciseRequired;

    @ApiProperty()
    healthTip!: string;
}