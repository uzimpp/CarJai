package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"
)

// --- Configuration ---
const (
	// URL อ้างอิงจาก ocr_service.go
	targetURL = "https://api.aigen.online/aiscript/vehicle-registration-book/v2"
	
	// ⚠️ IMPORTANT: ใส่ Key ของคุณที่นี่ หรือใช้ os.Getenv("AIGEN_KEY") จะปลอดภัยกว่า
	apiKey    = "AG3yjquxg7c5zr2amb58i55i3suov5kjik" 
	
	// Path รูปภาพ (ใช้ไฟล์เดียวกับที่แนบมา)
	imagePath = "./registration_book.png" 

	// Settings สำหรับการ Test
	startRPS     = 1              // เริ่มที่ 1 req/sec
	maxRPS       = 50             // ลิมิตสูงสุดที่จะทดสอบ
	stepRPS      = 2              // เพิ่มทีละ 2 req/sec
	stepDuration = 3 * time.Second // ยิงแช่ไว้นานเท่าไหร่ในแต่ละ Step
)

// Payload struct เหมือนใน ocr_service.go
type aigenJSONRequest struct {
	Image string `json:"image"`
}

func main() {
	fmt.Println("--- 🚀 Initializing AIGEN OCR Load Test (JSON/Base64 Mode) ---")

	// 1. เตรียม Payload (ทำครั้งเดียวเพื่อประหยัด CPU)
	fmt.Println("📝 Preparing Payload...")
	requestBody, err := preparePayload(imagePath)
	if err != nil {
		fmt.Printf("❌ Error preparing payload: %v\n", err)
		return
	}
	fmt.Println("✅ Payload Ready (Image loaded & Base64 encoded)")

	// 2. Sanity Check (ยิงเทส 1 ครั้งก่อนเริ่มของจริง)
	fmt.Println("\n🔎 Running Sanity Check (1 Request)...")
	statusCode, body := sendRequest(requestBody)
	if statusCode == 200 {
		fmt.Println("✅ Sanity Check Passed! API Key & Payload are correct.")
	} else {
		fmt.Printf("❌ Sanity Check Failed! Status: %d\nResponse: %s\n", statusCode, body)
		fmt.Println("PLEASE FIX CONFIG BEFORE CONTINUING.")
		return
	}

	// 3. เริ่ม Load Test loop
	fmt.Println("\n🔥 Starting Rate Limit Discovery...")
	currentRPS := startRPS

	for currentRPS <= maxRPS {
		fmt.Printf("\n[Step] Testing Rate: %d Req/Sec\n", currentRPS)
		
		var wg sync.WaitGroup
		successCount := int32(0)
		limitHitCount := int32(0) // 429
		errorCount := int32(0)    // 4xx, 5xx
		
		start := time.Now()

		// ยิง Request ขนานกัน
		for i := 0; i < currentRPS; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				code, _ := sendRequest(requestBody) // ใช้ Payload ที่เตรียมไว้แล้ว
				
				if code == 200 {
					atomic.AddInt32(&successCount, 1)
				} else if code == 429 {
					atomic.AddInt32(&limitHitCount, 1)
				} else {
					atomic.AddInt32(&errorCount, 1)
				}
			}()
		}

		wg.Wait()
		duration := time.Since(start)

		// Report ผลลัพธ์
		fmt.Printf("   -> 📊 Result: Success=%d | ⛔ Limit(429)=%d | ❌ Errors=%d\n", successCount, limitHitCount, errorCount)
		fmt.Printf("   -> ⏱️ Actual Duration: %v\n", duration)

		// Logic การหยุดเทส
		if limitHitCount > 0 {
			fmt.Println("\n🔴🔴🔴 RATE LIMIT DETECTED! 🔴🔴🔴")
			fmt.Printf("👉 The API started rejecting requests around %d RPS\n", currentRPS)
			break
		}

		// ถ้า Error เยอะผิดปกติ (ที่ไม่ใช่ 429) ให้เตือน
		if errorCount > int32(float64(currentRPS)*0.2) { // Error เกิน 20%
			fmt.Println("⚠️  High Failure Rate detected (Not 429). Server might be struggling or blocking IP.")
		}

		time.Sleep(stepDuration)
		currentRPS += stepRPS
	}

	fmt.Println("\n--- Test Finished ---")
}

// preparePayload อ่านไฟล์และแปลงเป็น JSON Byte Slice รอไว้เลย
func preparePayload(path string) ([]byte, error) {
	fileBytes, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Logic ตาม service: Base64 -> JSON Struct -> Bytes
	base64Image := base64.StdEncoding.EncodeToString(fileBytes)
	payload := aigenJSONRequest{Image: base64Image}
	
	return json.Marshal(payload)
}

// sendRequest ยิง HTTP Request โดยใช้ Payload ที่เตรียมไว้
func sendRequest(jsonBody []byte) (int, string) {
	req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return 0, err.Error()
	}

	// Headers ตาม service เป๊ะๆ
	req.Header.Set("x-aigen-key", apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err.Error()
	}
	defer resp.Body.Close()

	// อ่าน Body เฉพาะตอน Error (เพื่อประหยัด Memory ตอนยิงรัวๆ)
	bodyStr := ""
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		bodyStr = string(b)
	} else {
		// ถ้า 200 เราไม่สน Body เพราะเราเทส Load
		io.Copy(io.Discard, resp.Body) 
	}

	return resp.StatusCode, bodyStr
}