package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Ayushmangit/adaago.git/backend/internal/db"
	"github.com/Ayushmangit/adaago.git/backend/internal/env"
	"github.com/Ayushmangit/adaago.git/backend/internal/service"
	"github.com/Ayushmangit/adaago.git/backend/internal/store"
)

func main() {
	appEnv := strings.ToLower(
		strings.TrimSpace(
			env.GetString(
				"ENV",
				"development",
			),
		),
	)

	if appEnv == "production" {
		log.Fatal(
			"refusing to seed development data in production",
		)
	}

	dbAddr := env.GetString(
		"DB_ADDR",
		"postgres://admin:adminpassword@localhost:5435/adaa?sslmode=disable",
	)

	maxIdleConns := env.GetInt(
		"DB_MAX_IDLE_CONNS",
		30,
	)

	maxOpenConns := env.GetInt(
		"DB_MAX_OPEN_CONNS",
		30,
	)

	maxIdleTime := env.GetString(
		"DB_MAX_IDLE_TIME",
		"15m",
	)

	database, err := db.New(
		dbAddr,
		maxOpenConns,
		maxIdleConns,
		maxIdleTime,
	)
	if err != nil {
		log.Fatal(
			"failed to connect to database: ",
			err,
		)
	}
	defer database.Close()

	storage := store.NewStorage(database)
	services := service.NewServices(storage)

	ctx, cancel := context.WithTimeout(
		context.Background(),
		30*time.Second,
	)
	defer cancel()

	fmt.Println("starting ADAAGO development seeder")
	fmt.Println()

	programs, err := seedPrograms(
		ctx,
		services,
	)
	if err != nil {
		log.Fatal(
			"failed to seed programs: ",
			err,
		)
	}

	batches, err := seedBatches(
		ctx,
		services,
		programs,
	)
	if err != nil {
		log.Fatal(
			"failed to seed batches: ",
			err,
		)
	}

	students, err := seedStudents(
		ctx,
		storage,
		services,
	)
	if err != nil {
		log.Fatal(
			"failed to seed students: ",
			err,
		)
	}

	if err := seedEnrollments(
		ctx,
		services,
		students,
		batches,
	); err != nil {
		log.Fatal(
			"failed to seed enrollments: ",
			err,
		)
	}

	fmt.Println()
	fmt.Println("development seed completed")
	fmt.Println()
	fmt.Println("Student password:")
	fmt.Println(service.DefaultStudentPassword)
}

func seedPrograms(
	ctx context.Context,
	services service.Services,
) (map[string]*store.Program, error) {
	fmt.Println("Programs")

	descriptionAstro := "Astro turf training and membership program"
	descriptionBadminton := "Badminton coaching and training program"
	descriptionSwimming := "Swimming coaching and training program"

	inputs := []service.CreateProgramInput{
		{
			Name:        "Astro Turf",
			Description: &descriptionAstro,
		},
		{
			Name:        "Badminton",
			Description: &descriptionBadminton,
		},
		{
			Name:        "Swimming",
			Description: &descriptionSwimming,
		},
	}

	existingPrograms, err := services.Programs.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	programsByName := make(
		map[string]*store.Program,
	)

	for i := range existingPrograms {
		program := existingPrograms[i]

		programsByName[program.Name] = &program
	}

	for _, input := range inputs {
		if program, exists := programsByName[input.Name]; exists {

			fmt.Printf(
				"  exists:  %s (id=%d)\n",
				program.Name,
				program.ID,
			)

			continue
		}

		program, err := services.Programs.Create(
			ctx,
			input,
		)
		if err != nil {
			return nil, err
		}

		programsByName[program.Name] = program

		fmt.Printf(
			"  created: %s (id=%d)\n",
			program.Name,
			program.ID,
		)
	}

	return programsByName, nil
}

func seedBatches(
	ctx context.Context,
	services service.Services,
	programs map[string]*store.Program,
) (map[string]*store.Batch, error) {
	fmt.Println()
	fmt.Println("Batches")

	type batchSeed struct {
		ProgramName     string
		Name            string
		StartTime       string
		EndTime         string
		Weekdays        []int64
		MonthlyFeePaise int64
		Capacity        int
	}

	seeds := []batchSeed{
		{
			ProgramName:     "Astro Turf",
			Name:            "Morning Batch",
			StartTime:       "06:00",
			EndTime:         "07:00",
			Weekdays:        []int64{1, 3, 5},
			MonthlyFeePaise: 150000,
			Capacity:        20,
		},
		{
			ProgramName:     "Astro Turf",
			Name:            "Evening Batch",
			StartTime:       "18:00",
			EndTime:         "19:00",
			Weekdays:        []int64{2, 4, 6},
			MonthlyFeePaise: 150000,
			Capacity:        20,
		},
		{
			ProgramName:     "Badminton",
			Name:            "Morning Batch",
			StartTime:       "07:00",
			EndTime:         "08:00",
			Weekdays:        []int64{1, 3, 5},
			MonthlyFeePaise: 120000,
			Capacity:        16,
		},
		{
			ProgramName:     "Badminton",
			Name:            "Evening Batch",
			StartTime:       "17:00",
			EndTime:         "18:00",
			Weekdays:        []int64{2, 4, 6},
			MonthlyFeePaise: 120000,
			Capacity:        16,
		},
		{
			ProgramName:     "Swimming",
			Name:            "Beginners",
			StartTime:       "08:00",
			EndTime:         "09:00",
			Weekdays:        []int64{1, 3, 5},
			MonthlyFeePaise: 200000,
			Capacity:        15,
		},
		{
			ProgramName:     "Swimming",
			Name:            "Intermediate",
			StartTime:       "09:00",
			EndTime:         "10:00",
			Weekdays:        []int64{2, 4, 6},
			MonthlyFeePaise: 250000,
			Capacity:        15,
		},
	}

	batchesByKey := make(
		map[string]*store.Batch,
	)

	for _, seed := range seeds {
		program, exists := programs[seed.ProgramName]

		if !exists {
			return nil, fmt.Errorf(
				"program %q was not seeded",
				seed.ProgramName,
			)
		}

		existingBatches, err := services.Batches.GetByProgramID(
			ctx,
			program.ID,
		)
		if err != nil {
			return nil, err
		}

		key := batchKey(
			seed.ProgramName,
			seed.Name,
		)

		var existing *store.Batch

		for i := range existingBatches {
			if existingBatches[i].Name ==
				seed.Name {

				batch := existingBatches[i]
				existing = &batch
				break
			}
		}

		if existing != nil {
			batchesByKey[key] = existing

			fmt.Printf(
				"  exists:  %s / %s (id=%d)\n",
				seed.ProgramName,
				seed.Name,
				existing.ID,
			)

			continue
		}

		capacity := seed.Capacity

		batch, err := services.Batches.Create(
			ctx,
			service.CreateBatchInput{
				ProgramID: program.ID,

				Name: seed.Name,

				StartTime: seed.StartTime,
				EndTime:   seed.EndTime,

				Weekdays: seed.Weekdays,

				MonthlyFeePaise: seed.MonthlyFeePaise,

				Capacity: &capacity,
			},
		)
		if err != nil {
			return nil, err
		}

		batchesByKey[key] = batch

		fmt.Printf(
			"  created: %s / %s (id=%d)\n",
			seed.ProgramName,
			seed.Name,
			batch.ID,
		)
	}

	return batchesByKey, nil
}

func seedStudents(
	ctx context.Context,
	storage store.Storage,
	services service.Services,
) ([]*store.StudentWithUser, error) {
	fmt.Println()
	fmt.Println("Students")

	type studentSeed struct {
		Email         string
		Username      string
		FullName      string
		Phone         string
		DateOfBirth   string
		GuardianName  string
		GuardianPhone string
		Address       string
	}

	seeds := []studentSeed{
		{
			Email:         "student01@adaago.test",
			Username:      "student01",
			FullName:      "Aarav Sharma",
			Phone:         "9000000001",
			DateOfBirth:   "2008-04-15",
			GuardianName:  "Rajesh Sharma",
			GuardianPhone: "9100000001",
			Address:       "Dehradun",
		},
		{
			Email:         "student02@adaago.test",
			Username:      "student02",
			FullName:      "Vihaan Singh",
			Phone:         "9000000002",
			DateOfBirth:   "2009-07-21",
			GuardianName:  "Vikram Singh",
			GuardianPhone: "9100000002",
			Address:       "Dehradun",
		},
		{
			Email:         "student03@adaago.test",
			Username:      "student03",
			FullName:      "Aditya Verma",
			Phone:         "9000000003",
			DateOfBirth:   "2007-02-11",
			GuardianName:  "Sanjay Verma",
			GuardianPhone: "9100000003",
			Address:       "Dehradun",
		},
		{
			Email:         "student04@adaago.test",
			Username:      "student04",
			FullName:      "Ananya Gupta",
			Phone:         "9000000004",
			DateOfBirth:   "2008-11-03",
			GuardianName:  "Amit Gupta",
			GuardianPhone: "9100000004",
			Address:       "Dehradun",
		},
		{
			Email:         "student05@adaago.test",
			Username:      "student05",
			FullName:      "Ishita Kapoor",
			Phone:         "9000000005",
			DateOfBirth:   "2009-01-17",
			GuardianName:  "Rohit Kapoor",
			GuardianPhone: "9100000005",
			Address:       "Dehradun",
		},
		{
			Email:         "student06@adaago.test",
			Username:      "student06",
			FullName:      "Arjun Mehta",
			Phone:         "9000000006",
			DateOfBirth:   "2007-09-08",
			GuardianName:  "Manish Mehta",
			GuardianPhone: "9100000006",
			Address:       "Dehradun",
		},
		{
			Email:         "student07@adaago.test",
			Username:      "student07",
			FullName:      "Riya Joshi",
			Phone:         "9000000007",
			DateOfBirth:   "2008-06-12",
			GuardianName:  "Deepak Joshi",
			GuardianPhone: "9100000007",
			Address:       "Dehradun",
		},
		{
			Email:         "student08@adaago.test",
			Username:      "student08",
			FullName:      "Kabir Malhotra",
			Phone:         "9000000008",
			DateOfBirth:   "2009-03-23",
			GuardianName:  "Nitin Malhotra",
			GuardianPhone: "9100000008",
			Address:       "Dehradun",
		},
		{
			Email:         "student09@adaago.test",
			Username:      "student09",
			FullName:      "Meera Rawat",
			Phone:         "9000000009",
			DateOfBirth:   "2007-12-30",
			GuardianName:  "Ajay Rawat",
			GuardianPhone: "9100000009",
			Address:       "Dehradun",
		},
		{
			Email:         "student10@adaago.test",
			Username:      "student10",
			FullName:      "Dev Thakur",
			Phone:         "9000000010",
			DateOfBirth:   "2008-08-19",
			GuardianName:  "Pankaj Thakur",
			GuardianPhone: "9100000010",
			Address:       "Dehradun",
		},
	}

	students := make(
		[]*store.StudentWithUser,
		0,
		len(seeds),
	)

	for _, seed := range seeds {
		existingUser, err := storage.Users.GetByEmail(
			ctx,
			seed.Email,
		)

		if err == nil {
			student, err := storage.Students.GetByUserID(
				ctx,
				existingUser.ID,
			)
			if err != nil {
				return nil, fmt.Errorf(
					"user %s exists but student profile lookup failed: %w",
					seed.Email,
					err,
				)
			}

			students = append(
				students,
				student,
			)

			fmt.Printf(
				"  exists:  %s (student_id=%d)\n",
				student.Email,
				student.ID,
			)

			continue
		}

		if !errors.Is(
			err,
			store.ErrNotFound,
		) {
			return nil, err
		}

		phone := seed.Phone
		dateOfBirth := seed.DateOfBirth
		guardianName := seed.GuardianName
		guardianPhone := seed.GuardianPhone
		address := seed.Address

		student, err := services.Students.Create(
			ctx,
			service.CreateStudentInput{
				Email:    seed.Email,
				Username: seed.Username,
				FullName: seed.FullName,

				Phone: &phone,

				DateOfBirth: &dateOfBirth,

				GuardianName: &guardianName,

				GuardianPhone: &guardianPhone,

				Address: &address,
			},
		)
		if err != nil {
			return nil, err
		}

		students = append(
			students,
			student,
		)

		fmt.Printf(
			"  created: %s (student_id=%d)\n",
			student.Email,
			student.ID,
		)
	}

	return students, nil
}

func seedEnrollments(
	ctx context.Context,
	services service.Services,
	students []*store.StudentWithUser,
	batches map[string]*store.Batch,
) error {
	fmt.Println()
	fmt.Println("Enrollments")

	type enrollmentSeed struct {
		StudentIndex int
		ProgramName  string
		BatchName    string
	}

	seeds := []enrollmentSeed{
		{
			StudentIndex: 0,
			ProgramName:  "Astro Turf",
			BatchName:    "Morning Batch",
		},
		{
			StudentIndex: 1,
			ProgramName:  "Astro Turf",
			BatchName:    "Morning Batch",
		},
		{
			StudentIndex: 2,
			ProgramName:  "Astro Turf",
			BatchName:    "Evening Batch",
		},
		{
			StudentIndex: 3,
			ProgramName:  "Badminton",
			BatchName:    "Morning Batch",
		},
		{
			StudentIndex: 4,
			ProgramName:  "Badminton",
			BatchName:    "Morning Batch",
		},
		{
			StudentIndex: 5,
			ProgramName:  "Badminton",
			BatchName:    "Evening Batch",
		},
		{
			StudentIndex: 6,
			ProgramName:  "Swimming",
			BatchName:    "Beginners",
		},
		{
			StudentIndex: 7,
			ProgramName:  "Swimming",
			BatchName:    "Beginners",
		},
		{
			StudentIndex: 8,
			ProgramName:  "Swimming",
			BatchName:    "Intermediate",
		},
		{
			StudentIndex: 9,
			ProgramName:  "Astro Turf",
			BatchName:    "Evening Batch",
		},
	}

	for _, seed := range seeds {
		if seed.StudentIndex >= len(students) {
			return fmt.Errorf(
				"student index %d does not exist",
				seed.StudentIndex,
			)
		}

		student := students[seed.StudentIndex]

		key := batchKey(
			seed.ProgramName,
			seed.BatchName,
		)

		batch, exists := batches[key]
		if !exists {
			return fmt.Errorf(
				"batch %s / %s was not seeded",
				seed.ProgramName,
				seed.BatchName,
			)
		}

		_, err := services.Enrollments.Create(
			ctx,
			service.CreateEnrollmentInput{
				StudentID: student.ID,
				BatchID:   batch.ID,
			},
		)
		if err != nil {
			if errors.Is(
				err,
				service.ErrEnrollmentExists,
			) {
				fmt.Printf(
					"  exists:  %s -> %s / %s\n",
					student.FullName,
					seed.ProgramName,
					seed.BatchName,
				)

				continue
			}

			return err
		}

		fmt.Printf(
			"  created: %s -> %s / %s\n",
			student.FullName,
			seed.ProgramName,
			seed.BatchName,
		)
	}

	return nil
}

func batchKey(
	programName string,
	batchName string,
) string {
	return programName + "::" + batchName
}
