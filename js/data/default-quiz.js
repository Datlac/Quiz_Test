window.QuizHub = window.QuizHub || {};

// Kho Quiz mặc định nạp sẵn lần đầu (bạn có thể xóa hoặc dán thêm kho mới trên giao diện)
QuizHub.DefaultQuiz = {
    id: 'default-csharp-dotnet-nlu',
    title: 'Ôn Tập Trắc Nghiệm C# & .NET — ĐH Nông Lâm TP.HCM',
    subtitle: 'Ngân hàng câu hỏi lý thuyết, đọc code & bẫy thi giữa kỳ C#, OOP, ADO.NET, EF Core & WinForms.',
    isDefault: true,
    createdAt: Date.now(),
    topics: [
        {
            id: 'topic1',
            name: '1. Kiến trúc .NET, CLR, Roslyn & C# Cơ bản',
            file: '1. Giới thiệu C#1.pptx',
            desc: 'CLR, Roslyn 4 bước, Assembly (IL/Metadata/Manifest), JIT Tiered, CTS/CLS, kiểu dữ liệu & ép kiểu.',
            color: 'blue'
        },
        {
            id: 'topic2',
            name: '2. OOP & Tính năng C# Hiện đại (C# 9–12)',
            file: '1. Giới thiệu C#2.pptx',
            desc: 'Properties ({get; set;}, init, required), Primary Constructors, Nullable (?. ?? ??=), Record & with.',
            color: 'emerald'
        },
        {
            id: 'topic3',
            name: '3. Console I/O, Collections & Delegates/Lambda',
            file: '1. Giới thiệu C#3.pptx',
            desc: 'Console.ReadKey, Boxing/Unboxing, List/Dictionary/HashSet/Queue/Stack, Action/Func/Predicate.',
            color: 'amber'
        },
        {
            id: 'topic4',
            name: '4. Regex, Exception Handling & File/Stream I/O',
            file: '1. Giới thiệu C#4.pptx',
            desc: 'RegularExpressions, try-catch-finally, Path/File/Directory, Encoding/BOM, FileStream.',
            color: 'purple'
        },
        {
            id: 'topic5',
            name: '5. ADO.NET, Entity Framework Core & WinForms',
            file: '2. ADO - EF.pptx & 3. WinForms.pptx',
            desc: 'Connected vs Disconnected, Connection Pooling, DbContext, AsNoTracking, N+1, BindingList.',
            color: 'indigo'
        },
        {
            id: 'topic6',
            name: '🔥 6. Tuyển tập Bẫy Code Giữa kỳ',
            file: 'Tổng hợp bẫy code C#',
            desc: 'Đọc kết quả code, bắt lỗi biên dịch (Compile-time) và ngoại lệ (Runtime) hay gặp.',
            color: 'rose'
        }
    ],
    questions: [
        {
            id: 1,
            topic: 'topic1',
            type: 'theory',
            source: 'File 1 • Slide 8-9 (Roslyn Compiler)',
            question: 'Thứ tự các giai đoạn xử lý mã nguồn C# của trình biên dịch Roslyn Compiler (Compiler-as-a-Service) là gì?',
            options: [
                'Syntax Analysis → Lexical Analysis → Emit MSIL → Semantic Analysis',
                'Lexical Analysis (Token) → Syntax Analysis (AST) → Semantic Analysis → Emit MSIL/CIL',
                'Semantic Analysis → Lexical Analysis → JIT Compilation → Native Machine Code',
                'Lexical Analysis → Emit Native Code → Syntax Analysis → Garbage Collection'
            ],
            correct: 1,
            explanation: 'Roslyn hoạt động qua 4 bước: Lexical Analysis tách Token → Syntax Analysis dựng cây AST → Semantic Analysis kiểm tra kiểu/logic → Emit sinh bytecode trung gian MSIL.'
        },
        {
            id: 2,
            topic: 'topic2',
            type: 'theory',
            source: 'File 2 • Slide 19 (Record & Value Equality)',
            question: 'Cho khai báo: public record PhongBanDto(int Ma, string Ten); Nếu khởi tạo var p1 = new PhongBanDto(1, "IT"); và var p2 = new PhongBanDto(1, "IT"); thì biểu thức (p1 == p2) trả về kết quả gì?',
            options: [
                'false, vì p1 và p2 nằm ở hai địa chỉ ô nhớ khác nhau trên Heap',
                'true, vì kiểu record tự động cài đặt Value Equality (so sánh giá trị thuộc tính)',
                'Lỗi biên dịch vì record không hỗ trợ toán tử ==',
                'false, trừ khi p1 và p2 kế thừa từ struct'
            ],
            correct: 1,
            explanation: 'Khác với class thông thường, kiểu record mặc định so sánh giá trị (Value Equality) của toàn bộ thuộc tính nên p1 == p2 trả về true.'
        },
        {
            id: 3,
            topic: 'topic3',
            type: 'code',
            source: 'File 3 • Slide 20-21 (HashSet<T>)',
            question: 'Điều gì xảy ra khi chạy đoạn mã sử dụng HashSet<int> dưới đây?',
            code: 'HashSet<int> numbers = new HashSet<int> { 1, 2, 2, 3, 3, 4 };\nConsole.WriteLine(numbers.Count);',
            options: [
                'Ném ngoại lệ ArgumentException vì thêm phần tử trùng lặp',
                'In ra số 6',
                'In ra số 4, vì HashSet<T> tự động bỏ qua phần tử trùng mà không báo lỗi',
                'Lỗi biên dịch vì HashSet<T> không hỗ trợ Collection Initializer'
            ],
            correct: 2,
            explanation: 'HashSet<T> chỉ lưu phần tử duy nhất. Nếu thêm phần tử đã tồn tại, nó âm thầm bỏ qua và giữ Count = 4.'
        },
        {
            id: 4,
            topic: 'topic4',
            type: 'theory',
            source: 'File 4 • Slide 42 (FileMode enum)',
            question: 'Khi khởi tạo FileStream với tham số FileMode.CreateNew, điều gì xảy ra nếu tệp tin tại đường dẫn chỉ định đã tồn tại trước đó?',
            options: [
                'Tự động ghi đè nội dung tệp cũ',
                'Mở tệp và di chuyển con trỏ về cuối tệp',
                'Ném ra ngoại lệ System.IO.IOException',
                'Tự động đổi tên tệp mới'
            ],
            correct: 2,
            explanation: 'FileMode.CreateNew yêu cầu tạo mới hoàn toàn, nếu file đã tồn tại sẽ ném IOException.'
        },
        {
            id: 5,
            topic: 'topic5',
            type: 'theory',
            source: 'File 5 • Slide 44-45 (.AsNoTracking())',
            question: 'Khi viết truy vấn LINQ trong EF Core chỉ để hiển thị danh sách lên màn hình (Read-only), việc chèn thêm .AsNoTracking() mang lại lợi ích gì?',
            options: [
                'Tự động xóa các bản ghi trùng lặp trong cơ sở dữ liệu',
                'Tắt bộ theo dõi ChangeTracker của DbContext, giảm RAM và tăng tốc độ truy vấn 30%–50%',
                'Tự động lưu thay đổi xuống DB mà không cần gọi SaveChangesAsync()',
                'Chuyển truy vấn sang mô hình Disconnected DataSet'
            ],
            correct: 1,
            explanation: 'Với màn hình chỉ đọc, .AsNoTracking() bỏ qua việc lưu snapshot vào ChangeTracker giúp tối ưu hiệu năng.'
        },
        {
            id: 6,
            topic: 'topic6',
            type: 'code',
            source: 'Bẫy Giữa kỳ • Phép cộng kiểu byte',
            question: 'Điều gì xảy ra khi biên dịch đoạn mã C# dưới đây?',
            code: 'byte a = 10;\nbyte b = 20;\nushort c = a;\nshort d = a + b;',
            options: [
                'Chạy thành công và in ra c = 10, d = 30',
                'Lỗi biên dịch ở dòng 3 (byte sang ushort)',
                'Lỗi biên dịch ở dòng 4 vì phép cộng hai biến byte (a + b) được C# nâng kiểu lên int',
                'Ném ngoại lệ OverflowException lúc chạy'
            ],
            correct: 2,
            explanation: 'Mọi phép toán số học trên các kiểu nhỏ hơn int (byte, short) đều trả về kiểu int, nên gán trực tiếp vào short d sẽ gây lỗi biên dịch.'
        }
    ],
    notes: [
        {
            topic: 'topic1',
            title: 'So sánh Parse() vs System.Convert vs TryParse()',
            badge: 'Phần 1 • Slide 25–27',
            table: {
                headers: ['Phương thức', 'Chuỗi hợp lệ ("123")', 'Chuỗi sai ("abc")', 'Đầu vào là null'],
                rows: [
                    ['int.Parse(s)', 'Trả về 123', 'Crash (FormatException)', 'Crash (ArgumentNullException)'],
                    ['Convert.ToInt32(s)', 'Trả về 123', 'Crash (FormatException)', 'An toàn: Trả về 0'],
                    ['int.TryParse(s, out r)', 'Trả về true, r = 123', 'Trả về false, r = 0', 'Trả về false, r = 0']
                ]
            }
        },
        {
            topic: 'topic6',
            title: 'Tổng hợp Bẫy Code Kinh điển trong Đề thi Giữa kỳ C#',
            badge: 'Phần 6 • Mẹo tránh mất điểm',
            items: [
                '<strong>1. Phép cộng <code>byte + byte</code>:</strong> Trả về kiểu <code>int</code>, gán vào <code>short</code> sẽ lỗi biên dịch.',
                '<strong>2. <code>Stream.Read()</code> vs <code>ReadByte()</code>:</strong> <code>Read()</code> trả về <code>0</code> khi hết file, còn <code>ReadByte()</code> trả về <code>-1</code>.',
                '<strong>3. <code>try-finally</code> có <code>return</code>:</strong> Khối <code>finally</code> LUÔN chạy trước khi hàm trả kết quả.',
                '<strong>4. <code>.AsNoTracking()</code> + <code>SaveChangesAsync()</code>:</strong> Không cập nhật DB vì ChangeTracker không theo dõi entity.'
            ]
        }
    ]
};