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

const (
	totalStudents = 500
	batchCapacity = 60
)

func main() {
	appEnv := strings.ToLower(strings.TrimSpace(env.GetString("ENV", "development")))
	if appEnv == "production" {
		log.Fatal("refusing to seed development data in production")
	}

	dbAddr := env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost:5435/adaa?sslmode=disable")
	maxIdleConns := env.GetInt("DB_MAX_IDLE_CONNS", 30)
	maxOpenConns := env.GetInt("DB_MAX_OPEN_CONNS", 30)
	maxIdleTime := env.GetString("DB_MAX_IDLE_TIME", "15m")

	database, err := db.New(dbAddr, maxOpenConns, maxIdleConns, maxIdleTime)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}
	defer database.Close()

	storage := store.NewStorage(database)
	services := service.NewServices(storage)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	fmt.Println("starting ADAAGO development seeder")
	fmt.Println()

	programs, err := seedPrograms(ctx, services)
	if err != nil {
		log.Fatal("failed to seed programs: ", err)
	}

	batches, err := seedBatches(ctx, services, programs)
	if err != nil {
		log.Fatal("failed to seed batches: ", err)
	}

	students, err := seedStudents(ctx, storage, services, totalStudents)
	if err != nil {
		log.Fatal("failed to seed students: ", err)
	}

	if err := seedEnrollments(ctx, services, students, batches); err != nil {
		log.Fatal("failed to seed enrollments: ", err)
	}

	fmt.Println()
	fmt.Println("development seed completed")
	fmt.Printf("students: %d\n", len(students))
	fmt.Printf("batches: %d\n", len(batches))
	fmt.Println()
	fmt.Println("Student password:")
	fmt.Println(service.DefaultStudentPassword)
}

func seedPrograms(ctx context.Context, services service.Services) (map[string]*store.Program, error) {
	fmt.Println("Programs")

	astroDescription := "Astro turf football training and membership program"
	badmintonDescription := "Badminton coaching and training program"
	swimmingDescription := "Swimming pool coaching and training program"

	inputs := []service.CreateProgramInput{
		{Name: "Astro Turf", Description: &astroDescription},
		{Name: "Badminton", Description: &badmintonDescription},
		{Name: "Swimming Pool", Description: &swimmingDescription},
	}

	existingPrograms, err := services.Programs.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	programsByName := make(map[string]*store.Program)

	for i := range existingPrograms {
		program := existingPrograms[i]
		programsByName[program.Name] = &program
	}

	for _, input := range inputs {
		if program, exists := programsByName[input.Name]; exists {
			fmt.Printf("  exists:  %s (id=%d)\n", program.Name, program.ID)
			continue
		}

		program, err := services.Programs.Create(ctx, input)
		if err != nil {
			return nil, err
		}

		programsByName[program.Name] = program
		fmt.Printf("  created: %s (id=%d)\n", program.Name, program.ID)
	}

	return programsByName, nil
}

type batchSeed struct {
	ProgramName     string
	Name            string
	StartTime       string
	EndTime         string
	Weekdays        []int64
	MonthlyFeePaise int64
	Capacity        int
}

func seedBatches(ctx context.Context, services service.Services, programs map[string]*store.Program) (map[string]*store.Batch, error) {
	fmt.Println()
	fmt.Println("Batches")

	seeds := []batchSeed{
		{ProgramName: "Astro Turf", Name: "U12", StartTime: "06:00", EndTime: "07:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 150000, Capacity: batchCapacity},
		{ProgramName: "Astro Turf", Name: "U15", StartTime: "07:00", EndTime: "08:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 150000, Capacity: batchCapacity},
		{ProgramName: "Astro Turf", Name: "U18", StartTime: "17:00", EndTime: "18:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 180000, Capacity: batchCapacity},
		{ProgramName: "Astro Turf", Name: "Adult", StartTime: "18:00", EndTime: "19:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 200000, Capacity: batchCapacity},

		{ProgramName: "Badminton", Name: "U12", StartTime: "06:00", EndTime: "07:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 120000, Capacity: batchCapacity},
		{ProgramName: "Badminton", Name: "U15", StartTime: "07:00", EndTime: "08:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 120000, Capacity: batchCapacity},
		{ProgramName: "Badminton", Name: "U18", StartTime: "17:00", EndTime: "18:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 140000, Capacity: batchCapacity},
		{ProgramName: "Badminton", Name: "Adult", StartTime: "18:00", EndTime: "19:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 160000, Capacity: batchCapacity},

		{ProgramName: "Swimming Pool", Name: "U12", StartTime: "06:00", EndTime: "07:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 180000, Capacity: batchCapacity},
		{ProgramName: "Swimming Pool", Name: "U15", StartTime: "07:00", EndTime: "08:00", Weekdays: []int64{1, 3, 5}, MonthlyFeePaise: 200000, Capacity: batchCapacity},
		{ProgramName: "Swimming Pool", Name: "U18", StartTime: "16:00", EndTime: "17:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 220000, Capacity: batchCapacity},
		{ProgramName: "Swimming Pool", Name: "Adult", StartTime: "17:00", EndTime: "18:00", Weekdays: []int64{2, 4, 6}, MonthlyFeePaise: 250000, Capacity: batchCapacity},
	}

	batchesByKey := make(map[string]*store.Batch)

	for _, seed := range seeds {
		program, exists := programs[seed.ProgramName]
		if !exists {
			return nil, fmt.Errorf("program %q was not seeded", seed.ProgramName)
		}

		existingBatches, err := services.Batches.GetByProgramID(ctx, program.ID)
		if err != nil {
			return nil, err
		}

		key := batchKey(seed.ProgramName, seed.Name)
		var existing *store.Batch

		for i := range existingBatches {
			if existingBatches[i].Name == seed.Name {
				batch := existingBatches[i]
				existing = &batch
				break
			}
		}

		if existing != nil {
			batchesByKey[key] = existing
			fmt.Printf("  exists:  %s / %s (id=%d)\n", seed.ProgramName, seed.Name, existing.ID)
			continue
		}

		capacity := seed.Capacity

		batch, err := services.Batches.Create(ctx, service.CreateBatchInput{
			ProgramID:       program.ID,
			Name:            seed.Name,
			StartTime:       seed.StartTime,
			EndTime:         seed.EndTime,
			Weekdays:        seed.Weekdays,
			MonthlyFeePaise: seed.MonthlyFeePaise,
			Capacity:        &capacity,
		})
		if err != nil {
			return nil, err
		}

		batchesByKey[key] = batch
		fmt.Printf("  created: %s / %s (id=%d)\n", seed.ProgramName, seed.Name, batch.ID)
	}

	return batchesByKey, nil
}

func seedStudents(ctx context.Context, storage store.Storage, services service.Services, total int) ([]*store.StudentWithUser, error) {
	fmt.Println()
	fmt.Println("Students")

	firstNames := []string{
		"Aarav", "Vihaan", "Aditya", "Arjun", "Kabir", "Dev", "Rohan", "Aryan", "Krishna", "Dhruv",
		"Ananya", "Ishita", "Riya", "Meera", "Diya", "Aditi", "Kiara", "Navya", "Saanvi", "Avni",
	}

	lastNames := []string{
		"Sharma", "Singh", "Verma", "Gupta", "Kapoor", "Mehta", "Joshi", "Malhotra", "Rawat", "Thakur",
		"Chauhan", "Rana", "Bisht", "Negi", "Agarwal",
	}

	addresses := []string{
		"Dehradun",
		"Rajpur Road, Dehradun",
		"Clement Town, Dehradun",
		"Prem Nagar, Dehradun",
		"Ballupur, Dehradun",
		"Patel Nagar, Dehradun",
		"Dalanwala, Dehradun",
	}

	students := make([]*store.StudentWithUser, 0, total)

	for i := 1; i <= total; i++ {
		firstName := firstNames[(i-1)%len(firstNames)]
		lastName := lastNames[((i-1)/len(firstNames))%len(lastNames)]

		fullName := fmt.Sprintf("%s %s %03d", firstName, lastName, i)
		email := fmt.Sprintf("student%03d@adaago.test", i)
		username := fmt.Sprintf("student%03d", i)
		phone := fmt.Sprintf("9%09d", i)
		guardianName := fmt.Sprintf("Guardian %03d", i)
		guardianPhone := fmt.Sprintf("8%09d", i)
		address := addresses[(i-1)%len(addresses)]
		dateOfBirth := generateDOBForIndex(i)

		existingUser, err := storage.Users.GetByEmail(ctx, email)

		if err == nil {
			student, err := storage.Students.GetByUserID(ctx, existingUser.ID)
			if err != nil {
				return nil, fmt.Errorf("user %s exists but student profile lookup failed: %w", email, err)
			}

			students = append(students, student)
			continue
		}

		if !errors.Is(err, store.ErrNotFound) {
			return nil, err
		}

		student, err := services.Students.Create(ctx, service.CreateStudentInput{
			Email:         email,
			Username:      username,
			FullName:      fullName,
			Phone:         &phone,
			DateOfBirth:   &dateOfBirth,
			GuardianName:  &guardianName,
			GuardianPhone: &guardianPhone,
			Address:       &address,
		})
		if err != nil {
			return nil, err
		}

		students = append(students, student)

		if i%50 == 0 || i == total {
			fmt.Printf("  students seeded: %d/%d\n", i, total)
		}
	}

	return students, nil
}

func seedEnrollments(ctx context.Context, services service.Services, students []*store.StudentWithUser, batches map[string]*store.Batch) error {
	fmt.Println()
	fmt.Println("Enrollments")

	batchesByGroup := map[int][]string{
		0: {
			batchKey("Astro Turf", "U12"),
			batchKey("Badminton", "U12"),
			batchKey("Swimming Pool", "U12"),
		},
		1: {
			batchKey("Astro Turf", "U15"),
			batchKey("Badminton", "U15"),
			batchKey("Swimming Pool", "U15"),
		},
		2: {
			batchKey("Astro Turf", "U18"),
			batchKey("Badminton", "U18"),
			batchKey("Swimming Pool", "U18"),
		},
		3: {
			batchKey("Astro Turf", "Adult"),
			batchKey("Badminton", "Adult"),
			batchKey("Swimming Pool", "Adult"),
		},
	}

	batchCounts := make(map[string]int)

	joinedAt := time.Now().UTC().AddDate(0, -1, 0).Format("2006-01-02")

	for i, student := range students {
		ageGroup := i % 4
		groupBatches := batchesByGroup[ageGroup]
		key := groupBatches[(i/4)%len(groupBatches)]

		batch, exists := batches[key]
		if !exists {
			return fmt.Errorf("batch %q not found", key)
		}

		if batchCounts[key] >= batchCapacity {
			return fmt.Errorf("batch %q reached capacity %d", key, batchCapacity)
		}

		_, err := services.Enrollments.Create(ctx, service.CreateEnrollmentInput{
			StudentID: student.ID,
			BatchID:   batch.ID,
			JoinedAt:  &joinedAt,
		})
		if err != nil {
			if errors.Is(err, service.ErrEnrollmentExists) {
				batchCounts[key]++
				continue
			}

			return err
		}

		batchCounts[key]++

		if (i+1)%50 == 0 || i+1 == len(students) {
			fmt.Printf("  enrollments seeded: %d/%d\n", i+1, len(students))
		}
	}

	fmt.Println()
	fmt.Println("Batch distribution")

	batchOrder := []string{
		batchKey("Astro Turf", "U12"),
		batchKey("Astro Turf", "U15"),
		batchKey("Astro Turf", "U18"),
		batchKey("Astro Turf", "Adult"),
		batchKey("Badminton", "U12"),
		batchKey("Badminton", "U15"),
		batchKey("Badminton", "U18"),
		batchKey("Badminton", "Adult"),
		batchKey("Swimming Pool", "U12"),
		batchKey("Swimming Pool", "U15"),
		batchKey("Swimming Pool", "U18"),
		batchKey("Swimming Pool", "Adult"),
	}

	for _, key := range batchOrder {
		batch := batches[key]
		fmt.Printf("  %-30s %3d/%d students\n", key, batchCounts[key], getBatchCapacity(batch))
	}

	return nil
}

func generateDOBForIndex(index int) string {
	day := (index % 27) + 1

	switch (index - 1) % 4 {
	case 0:
		return fmt.Sprintf("2016-05-%02d", day)
	case 1:
		return fmt.Sprintf("2013-05-%02d", day)
	case 2:
		return fmt.Sprintf("2010-05-%02d", day)
	default:
		return fmt.Sprintf("2000-05-%02d", day)
	}
}

func getBatchCapacity(batch *store.Batch) int {
	if batch.Capacity == nil {
		return 0
	}

	return *batch.Capacity
}

func batchKey(programName string, batchName string) string {
	return programName + "::" + batchName
}
