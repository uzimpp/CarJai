package models

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "strings"
    "time"
)

type Report struct {
    ID                 int             `json:"id" db:"id"`
    ReportType         string          `json:"reportType" db:"report_type"`
    CarID              *int            `json:"carId,omitempty" db:"car_id"`
    SellerID           *int            `json:"sellerId,omitempty" db:"seller_id"`
    ReporterID         int             `json:"reporterId" db:"reporter_id"`
    Topic              string          `json:"topic" db:"topic"`
    SubTopics          json.RawMessage `json:"subTopics" db:"sub_topics"`
    Description        string          `json:"description" db:"description"`
    Status             string          `json:"status" db:"status"`
    CreatedAt          time.Time       `json:"createdAt" db:"created_at"`
    ReviewedAt         *time.Time      `json:"reviewedAt,omitempty" db:"reviewed_at"`
    ReviewedByAdminID  *int            `json:"reviewedByAdminId,omitempty" db:"reviewed_by_admin_id"`
    AdminNotes         *string         `json:"adminNotes,omitempty" db:"admin_notes"`
}

// SellerAdminAction represents moderation actions performed by admins
type SellerAdminAction struct {
    ID          int        `json:"id" db:"id"`
    SellerID    int        `json:"sellerId" db:"seller_id"`
    AdminID     int        `json:"adminId" db:"admin_id"`
    Action      string     `json:"action" db:"action"`
    Notes       *string    `json:"notes,omitempty" db:"notes"`
    SuspendUntil *time.Time `json:"suspendUntil,omitempty" db:"suspend_until"`
    CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
}

// ReportListResult represents a paginated list of reports
type ReportListResult struct {
    Success bool     `json:"success"`
    Data    []Report `json:"data"`
    Total   int      `json:"total"`
}

type ReportRepository struct {
    db *Database
}

func NewReportRepository(db *Database) *ReportRepository {
    return &ReportRepository{db: db}
}

func (r *ReportRepository) CreateCarReport(reporterID, carID int, topic string, subTopics json.RawMessage, description string) (int, error) {
    query := `INSERT INTO reports (report_type, car_id, reporter_id, topic, sub_topics, description)
              VALUES ('car', $1, $2, $3, $4, $5) RETURNING id`
    var id int
    err := r.db.DB.QueryRow(query, carID, reporterID, topic, subTopics, description).Scan(&id)
    return id, err
}

func (r *ReportRepository) CreateSellerReport(reporterID, sellerID int, topic string, subTopics json.RawMessage, description string) (int, error) {
    query := `INSERT INTO reports (report_type, seller_id, reporter_id, topic, sub_topics, description)
              VALUES ('seller', $1, $2, $3, $4, $5) RETURNING id`
    var id int
    err := r.db.DB.QueryRow(query, sellerID, reporterID, topic, subTopics, description).Scan(&id)
    return id, err
}

func (r *ReportRepository) HasRecentDuplicate(reporterID int, reportType string, targetID int, days int) (bool, error) {
    var query string
    if reportType == "car" {
        query = `SELECT 1 FROM reports WHERE reporter_id=$1 AND report_type='car' AND car_id=$2 AND created_at >= NOW() - INTERVAL '` + fmt.Sprintf("%d", days) + ` days' LIMIT 1`
    } else {
        query = `SELECT 1 FROM reports WHERE reporter_id=$1 AND report_type='seller' AND seller_id=$2 AND created_at >= NOW() - INTERVAL '` + fmt.Sprintf("%d", days) + ` days' LIMIT 1`
    }
    var exists int
    err := r.db.DB.QueryRow(query, reporterID, targetID).Scan(&exists)
    if err == sql.ErrNoRows {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return true, nil
}

func (r *ReportRepository) HasRecentDuplicateByTopic(reporterID int, reportType string, targetID int, topic string, days int) (bool, error) {
    var query string
    if reportType == "car" {
        query = `SELECT 1 FROM reports WHERE reporter_id=$1 AND report_type='car' AND car_id=$2 AND topic=$3 AND created_at >= NOW() - INTERVAL '` + fmt.Sprintf("%d", days) + ` days' LIMIT 1`
    } else {
        query = `SELECT 1 FROM reports WHERE reporter_id=$1 AND report_type='seller' AND seller_id=$2 AND topic=$3 AND created_at >= NOW() - INTERVAL '` + fmt.Sprintf("%d", days) + ` days' LIMIT 1`
    }
    var exists int
    err := r.db.DB.QueryRow(query, reporterID, targetID, topic).Scan(&exists)
    if err == sql.ErrNoRows {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return true, nil
}

func (r *ReportRepository) GetReportByID(id int) (*Report, error) {
    query := `SELECT id, report_type, car_id, seller_id, reporter_id, topic, sub_topics, description, status, created_at, reviewed_at, reviewed_by_admin_id, admin_notes FROM reports WHERE id=$1`
    row := r.db.DB.QueryRow(query, id)
    var rep Report
    var sub json.RawMessage
    var reviewedAt sql.NullTime
    var reviewedBy sql.NullInt64
    var adminNotes sql.NullString
    var carID sql.NullInt64
    var sellerID sql.NullInt64
    if err := row.Scan(&rep.ID, &rep.ReportType, &carID, &sellerID, &rep.ReporterID, &rep.Topic, &sub, &rep.Description, &rep.Status, &rep.CreatedAt, &reviewedAt, &reviewedBy, &adminNotes); err != nil {
        return nil, err
    }
    if reviewedAt.Valid {
        t := reviewedAt.Time
        rep.ReviewedAt = &t
    }
    if reviewedBy.Valid {
        v := int(reviewedBy.Int64)
        rep.ReviewedByAdminID = &v
    }
    if adminNotes.Valid {
        s := adminNotes.String
        rep.AdminNotes = &s
    }
    if carID.Valid {
        v := int(carID.Int64)
        rep.CarID = &v
    }
    if sellerID.Valid {
        v := int(sellerID.Int64)
        rep.SellerID = &v
    }
    rep.SubTopics = sub
    return &rep, nil
}

type ReportFilters struct {
    Type   string
    Status string
    Q      string
    Offset int
    Limit  int
}

func (r *ReportRepository) ListReports(filters ReportFilters) ([]Report, int, error) {
    base := `SELECT id, report_type, car_id, seller_id, reporter_id, topic, sub_topics, description, status, created_at, reviewed_at, reviewed_by_admin_id, admin_notes FROM reports`
    where := []string{}
    args := []any{}
    ai := 1
    if filters.Type != "" {
        where = append(where, fmt.Sprintf("report_type=$%d", ai))
        args = append(args, filters.Type)
        ai++
    }
    if filters.Status != "" {
        where = append(where, fmt.Sprintf("status=$%d", ai))
        args = append(args, filters.Status)
        ai++
    }
    if filters.Q != "" {
        where = append(where, fmt.Sprintf("(description ILIKE $%d OR topic ILIKE $%d)", ai, ai))
        args = append(args, "%"+filters.Q+"%")
        ai++
    }
    var sb strings.Builder
    sb.WriteString(base)
    if len(where) > 0 {
        sb.WriteString(" WHERE ")
        sb.WriteString(strings.Join(where, " AND "))
    }
    sb.WriteString(" ORDER BY created_at DESC")
    if filters.Limit <= 0 {
        filters.Limit = 20
    }
    sb.WriteString(fmt.Sprintf(" LIMIT %d OFFSET %d", filters.Limit, filters.Offset))

    rows, err := r.db.DB.Query(sb.String(), args...)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()
    var list []Report
    for rows.Next() {
        var rep Report
        var sub json.RawMessage
        var reviewedAt sql.NullTime
        var reviewedBy sql.NullInt64
        var adminNotes sql.NullString
        var carID sql.NullInt64
        var sellerID sql.NullInt64
        if err := rows.Scan(&rep.ID, &rep.ReportType, &carID, &sellerID, &rep.ReporterID, &rep.Topic, &sub, &rep.Description, &rep.Status, &rep.CreatedAt, &reviewedAt, &reviewedBy, &adminNotes); err != nil {
            return nil, 0, err
        }
        if reviewedAt.Valid {
            t := reviewedAt.Time
            rep.ReviewedAt = &t
        }
        if reviewedBy.Valid {
            v := int(reviewedBy.Int64)
            rep.ReviewedByAdminID = &v
        }
        if adminNotes.Valid {
            s := adminNotes.String
            rep.AdminNotes = &s
        }
        if carID.Valid {
            v := int(carID.Int64)
            rep.CarID = &v
        }
        if sellerID.Valid {
            v := int(sellerID.Int64)
            rep.SellerID = &v
        }
        rep.SubTopics = sub
        list = append(list, rep)
    }
    // Get total count with same filters (without limit/offset)
    countBase := "SELECT COUNT(*) FROM reports"
    var cb strings.Builder
    cb.WriteString(countBase)
    if len(where) > 0 {
        cb.WriteString(" WHERE ")
        cb.WriteString(strings.Join(where, " AND "))
    }
    var total int
    if err := r.db.DB.QueryRow(cb.String(), args...).Scan(&total); err != nil {
        return nil, 0, err
    }
    return list, total, nil
}

func (r *ReportRepository) UpdateReportStatusTx(tx *sql.Tx, id int, status string, adminNotes *string, adminID int) error {
    now := time.Now()
    query := `UPDATE reports SET status=$1, admin_notes=$2, reviewed_at=$3, reviewed_by_admin_id=$4 WHERE id=$5`
    _, err := tx.Exec(query, status, adminNotes, now, adminID, id)
    return err
}

func (r *ReportRepository) LogSellerAdminActionTx(tx *sql.Tx, sellerID, adminID int, action string, notes *string, suspendUntil *time.Time) (int, error) {
    query := `INSERT INTO seller_admin_actions (seller_id, admin_id, action, notes, suspend_until) VALUES ($1,$2,$3,$4,$5) RETURNING id`
    var id int
    err := tx.QueryRow(query, sellerID, adminID, action, notes, suspendUntil).Scan(&id)
    return id, err
}