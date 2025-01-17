<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="单词" prop="word">
        <el-input
          v-model="queryParams.word"
          placeholder="请输入单词"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:words:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:words:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:words:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="wordsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="单词ID" align="center" prop="wordId" width="100" />
      <el-table-column label="单词" align="center" prop="word" :show-overflow-tooltip="true" />
      <el-table-column label="示例句子" align="center" prop="exampleSentence" :show-overflow-tooltip="true" />
      <el-table-column label="排序" align="center" prop="sortOrder" width="100">
        <template #default="scope">
          {{ scope.row.sortOrder }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:words:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:words:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改单词对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form ref="wordsRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="单词" prop="word">
              <el-input v-model="form.word" placeholder="请输入单词" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="示例句子" prop="exampleSentence">
              <el-input
                v-model="form.exampleSentence"
                type="textarea"
                :rows="3"
                placeholder="请输入示例句子"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="form.sortOrder"
                :precision="5"
                :step="0.00001"
                :min="0"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Words">
import { listWords, getWords, delWords, addWords, updateWords } from "@/api/system/words";

const { proxy } = getCurrentInstance();
const wordsList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    word: undefined,
  },
  rules: {
    word: [{ required: true, message: "单词不能为空", trigger: "blur" }],
    exampleSentence: [{ required: true, message: "示例句子不能为空", trigger: "blur" }],
    sortOrder: [
      { required: true, message: "排序值不能为空", trigger: "blur" },
      { type: "number", message: "排序值必须为数字", trigger: "blur" }
    ]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询单词列表 */
function getList() {
  loading.value = true;
  listWords(queryParams.value).then(response => {
    wordsList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    wordId: undefined,
    word: undefined,
    exampleSentence: undefined,
    sortOrder: undefined
  };
  proxy.resetForm("wordsRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.wordId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加单词";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const wordId = row.wordId || ids.value;
  getWords(wordId).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改单词";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["wordsRef"].validate(valid => {
    if (valid) {
      if (form.value.wordId != undefined) {
        updateWords(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addWords(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const wordIds = row.wordId || ids.value;
  proxy.$modal.confirm('是否确认删除单词编号为"' + wordIds + '"的数据项？').then(function() {
    return delWords(wordIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

getList();
</script>